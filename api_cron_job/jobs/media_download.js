import { randomUUID } from 'node:crypto';
import { getDb } from '../../database/DataManager.js';
import {
  DISK_FILE_NAME,
  DOWNLOAD_MEDIA_ID,
  ORIGINAL_FILE_NAME,
} from '../../database/model/DownloadFile.js';
import {
  ERROR_MESSAGE,
  FINISHED_AT,
  ID,
  SITE,
  SOURCE,
  STATUS,
  STATUSES,
  URL,
} from '../../database/model/DownloadMedia.js';
import { create as createDownloadFile } from '../../database/modelCRUD/downloadFile/Create.js';
import { removeByMediaId } from '../../database/modelCRUD/downloadFile/RemoveByMediaId.js';
import { claimNextPending } from '../../database/modelCRUD/downloadMedia/ClaimNextPending.js';
import { update } from '../../database/modelCRUD/downloadMedia/Update.js';
import { getDownloader } from '../../api_downloader/downloaders/index.js';
import {
  download as ytDlpDownload,
  probe as ytDlpProbe,
} from '../../api_downloader/services/ytdlp/YtDlpService.js';
import {
  ensureMediaDir,
  findDownloadedFiles,
  removeStemArtifacts,
} from '../../api_downloader/utils/diskFileName.js';
import downloaderSetting from '../../api_downloader/Setting.js';
import localSetting from '../Setting.js';

export const key = localSetting.JOB_MEDIA_DOWNLOAD_KEY;
export const title = 'Media download';
export const description = 'Download pending media';
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

function outputStemFor(mediaId) {
  return `${mediaId}_${randomUUID()}`;
}

async function discardDownloadFiles(db, mediaId, outputDir, stem) {
  if (outputDir && stem) {
    try {
      await removeStemArtifacts(outputDir, stem);
    } catch (cleanupError) {
      console.error(`media_download: cleanup failed id=${mediaId} ${cleanupError}`);
    }
  }

  try {
    removeByMediaId(db, mediaId);
  } catch (cleanupError) {
    console.error(`media_download: file row cleanup failed id=${mediaId} ${cleanupError}`);
  }
}

async function downloadWithYtDlp(db, row, downloader, outputDir, stem) {
  const id = row[ID];
  const url = row[URL];

  if (typeof downloader.assertTargetMatches === 'function') {
    const info = await ytDlpProbe({ url, extraArgs: downloader.extraArgs });
    downloader.assertTargetMatches(row, info);
  }

  const result = await ytDlpDownload({
    url,
    outputDir,
    outputStem: stem,
    extraArgs: downloader.extraArgs,
  });

  const discovered = await findDownloadedFiles(outputDir, stem);
  const resultFiles = Array.isArray(result.files) && result.files.length > 0
    ? result.files
    : [{
      diskFileName: result.diskFileName,
      originalFileName: result.originalFileName,
    }];

  const filesByName = new Map(
    resultFiles
      .filter((entry) => entry?.diskFileName)
      .map((entry) => [entry.diskFileName, entry]),
  );

  const files = discovered.length > 0
    ? discovered.map((entry) => {
      const printed = filesByName.get(entry.name);
      return {
        diskFileName: entry.name,
        originalFileName: printed?.originalFileName || entry.name,
      };
    })
    : resultFiles.map((entry) => ({
      diskFileName: entry.diskFileName,
      originalFileName: entry.originalFileName,
    }));

  if (!files.length) {
    await discardDownloadFiles(db, id, outputDir, stem);
    return false;
  }

  for (let offset = 0; offset < files.length; offset += 1) {
    const file = files[offset];
    const index = offset + 1;
    const originalFileName = downloader.resolveOriginalFileName(row, {
      diskFileName: file.diskFileName,
      originalFileName: file.originalFileName,
      index,
      fileCount: files.length,
    });

    const savedFile = createDownloadFile(db, {
      [DOWNLOAD_MEDIA_ID]: id,
      [DISK_FILE_NAME]: file.diskFileName,
      [ORIGINAL_FILE_NAME]: originalFileName,
    });

    if (!savedFile) {
      await discardDownloadFiles(db, id, outputDir, stem);
      return false;
    }
  }

  return true;
}

async function processOne(db, row) {
  const id = row[ID];
  const source = row[SOURCE];
  const site = row[SITE];
  const url = row[URL];
  const downloader = getDownloader(source, site, url);
  const stem = outputStemFor(id);
  let outputDir = null;

  try {
    outputDir = await ensureMediaDir(source, site);

    if (typeof downloader.download === 'function') {
      await downloader.download({
        db,
        row,
        outputDir,
        stem,
      });
    } else {
      const saved = await downloadWithYtDlp(db, row, downloader, outputDir, stem);
      if (!saved) {
        return;
      }
    }

    const updated = update(db, id, {
      [STATUS]: STATUSES.COMPLETED,
      [ERROR_MESSAGE]: null,
      [FINISHED_AT]: nowSqliteUtc(),
    });

    if (!updated) {
      await discardDownloadFiles(db, id, outputDir, stem);
    }
  } catch (error) {
    await discardDownloadFiles(db, id, outputDir, stem);

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
