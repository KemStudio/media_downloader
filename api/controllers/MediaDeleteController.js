import path from 'node:path';
import { mediaDirFor, removeStemArtifacts } from '../../api_downloader/utils/diskFileName.js';
import { getDb } from '../../database/DataManager.js';
import { DISK_FILE_NAME } from '../../database/model/DownloadFile.js';
import {
  ACCOUNT_ID,
  SITE,
  SOURCE,
  STATUS,
  STATUSES,
} from '../../database/model/DownloadMedia.js';
import { findByMediaId } from '../../database/modelCRUD/downloadFile/FindByMediaId.js';
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

function resolveAccountId(req) {
  const bearerAccountId = Number(req.accountId);
  if (Number.isInteger(bearerAccountId) && bearerAccountId >= 1) {
    return bearerAccountId;
  }
  return sessionAccountId(req);
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

async function removeStoredDiskFiles(source, site, files) {
  const dir = mediaDirFor(source, site);
  const stems = new Set();

  for (const file of files) {
    const stem = diskCleanupStem(file[DISK_FILE_NAME]);
    if (stem) {
      stems.add(stem);
    }
  }

  for (const stem of stems) {
    await removeStemArtifacts(dir, stem);
  }
}

export async function mediaDelete(req, res) {
  const accountId = resolveAccountId(req);
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
    const files = findByMediaId(db, id);
    const shouldCleanupDisk = status !== STATUSES.DOWNLOADING;

    if (shouldCleanupDisk) {
      try {
        await removeStoredDiskFiles(source, site, files);
      } catch (cleanupError) {
        console.error(`media_delete: disk cleanup failed id=${id} ${cleanupError}`);
      }
    }

    removeDownloadMedia(db, id);

    res.status(200).json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export default {
  mediaDelete,
};
