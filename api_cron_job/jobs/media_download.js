import { getDb } from '../../database/DataManager.js';
import {
  DISK_FILE_NAME,
  ERROR_MESSAGE,
  FINISHED_AT,
  ID,
  ORIGINAL_FILE_NAME,
  SITE,
  SOURCE,
  STATUS,
  STATUSES,
  URL,
} from '../../database/model/DownloadMedia.js';
import { claimNextPending } from '../../database/modelCRUD/downloadMedia/ClaimNextPending.js';
import { update } from '../../database/modelCRUD/downloadMedia/Update.js';
import { download as ytDlpDownload } from '../../api_downloader/shared/services/YtDlpService.js';
import {
  ensureMediaDir,
  removeStemArtifacts,
} from '../../api_downloader/shared/utils/diskFileName.js';
import downloaderSetting from '../../api_downloader/Setting.js';
import localSetting from '../Setting.js';

export const key = localSetting.JOB_MEDIA_DOWNLOAD_KEY;
export const title = 'Media download';
export const description = 'Download pending media with yt-dlp';
export const default_interval_ms = localSetting.JOB_MEDIA_DOWNLOAD_INTERVAL_MS;
export const default_enabled = true;

function nowSqliteUtc() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

function truncateError(message) {
  const text = String(message || 'download failed').trim() || 'download failed';
  const max = downloaderSetting.ERROR_MESSAGE_MAX_LENGTH;
  if (text.length <= max) {
    return text;
  }
  return `${text.slice(0, max - 3)}...`;
}

async function processOne(db, row) {
  const id = row[ID];
  const stem = row[DISK_FILE_NAME];
  const source = row[SOURCE];
  const site = row[SITE];
  const url = row[URL];

  const outputDir = await ensureMediaDir(source, site);

  try {
    const result = await ytDlpDownload({
      url,
      outputDir,
      outputStem: stem,
    });

    update(db, id, {
      [STATUS]: STATUSES.COMPLETED,
      [DISK_FILE_NAME]: result.diskFileName,
      [ORIGINAL_FILE_NAME]: result.originalFileName,
      [ERROR_MESSAGE]: null,
      [FINISHED_AT]: nowSqliteUtc(),
    });
  } catch (error) {
    try {
      await removeStemArtifacts(outputDir, stem);
    } catch (cleanupError) {
      console.error(`media_download: cleanup failed id=${id} ${cleanupError}`);
    }

    update(db, id, {
      [STATUS]: STATUSES.FAILED,
      [ERROR_MESSAGE]: truncateError(error?.message || error),
      [FINISHED_AT]: nowSqliteUtc(),
    });
  }
}

export async function run() {
  const db = getDb();
  const batchLimit = localSetting.JOB_MEDIA_DOWNLOAD_BATCH_LIMIT;

  for (let index = 0; index < batchLimit; index += 1) {
    const row = claimNextPending(db);
    if (!row) {
      break;
    }

    await processOne(db, row);
  }
}

export default {
  key,
  title,
  description,
  default_interval_ms,
  default_enabled,
  run,
};
