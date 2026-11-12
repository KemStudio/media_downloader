import path from 'node:path';
import {
  mediaDirFor,
  removeStemArtifacts,
} from '../../api_downloader/shared/utils/diskFileName.js';
import { getDb } from '../../database/DataManager.js';
import {
  ACCOUNT_ID,
  DISK_FILE_NAME,
  SITE,
  SOURCE,
  STATUS,
  STATUSES,
} from '../../database/model/DownloadMedia.js';
import { findById } from '../../database/modelCRUD/downloadMedia/FindById.js';
import { remove as removeDownloadMedia } from '../../database/modelCRUD/downloadMedia/Remove.js';
import { ACCOUNT_ID_SESSION_KEY } from '../utils/session.js';

function sessionAccountId(req) {
  const accountId = Number(req.session?.[ACCOUNT_ID_SESSION_KEY]);
  if (!Number.isInteger(accountId) || accountId < 1) {
    return null;
  }
  return accountId;
}

function parseMediaId(raw) {
  if (raw === undefined || raw === null || raw === '') {
    return null;
  }

  if (Array.isArray(raw)) {
    return null;
  }

  const value = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isInteger(value) || value < 1) {
    return null;
  }

  return value;
}

function diskCleanupStem(diskFileName) {
  if (!diskFileName || typeof diskFileName !== 'string') {
    return null;
  }

  const safeName = path.basename(diskFileName);
  if (!safeName || safeName !== diskFileName) {
    return null;
  }

  return path.parse(safeName).name || safeName;
}

export async function mediaDelete(req, res) {
  const accountId = sessionAccountId(req);
  if (accountId === null) {
    res.status(401).json({ error: 'not authenticated' });
    return;
  }

  const id = parseMediaId(req.params.id);
  if (id === null) {
    res.status(400).json({ error: 'id must be a positive integer' });
    return;
  }

  try {
    const db = getDb();
    const media = findById(db, id);
    if (!media || media[ACCOUNT_ID] !== accountId) {
      res.status(404).json({ error: 'download media not found' });
      return;
    }

    const source = media[SOURCE];
    const site = media[SITE];
    const status = media[STATUS];
    const diskFileName = media[DISK_FILE_NAME];
    const shouldCleanupDisk = status !== STATUSES.DOWNLOADING;

    removeDownloadMedia(db, id);

    if (shouldCleanupDisk) {
      const stem = diskCleanupStem(diskFileName);
      if (stem) {
        try {
          await removeStemArtifacts(mediaDirFor(source, site), stem);
        } catch (cleanupError) {
          console.error(`media_delete: disk cleanup failed id=${id} ${cleanupError}`);
        }
      }
    }

    res.status(200).json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export default {
  mediaDelete,
};
