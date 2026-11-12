import fs from 'node:fs';
import path from 'node:path';
import {
  mediaDirFor,
  sanitizeOriginalFileName,
} from '../../api_downloader/utils/diskFileName.js';
import { getDb } from '../../database/DataManager.js';
import {
  DISK_FILE_NAME,
  DOWNLOAD_MEDIA_ID,
  ORIGINAL_FILE_NAME,
} from '../../database/model/DownloadFile.js';
import {
  ACCOUNT_ID,
  SITE,
  SOURCE,
  STATUS,
  STATUSES,
} from '../../database/model/DownloadMedia.js';
import { findById as findFileById } from '../../database/modelCRUD/downloadFile/FindById.js';
import { findById as findMediaById } from '../../database/modelCRUD/downloadMedia/FindById.js';
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

function parseFileId(raw) {
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

export function mediaDownload(req, res) {
  const accountId = resolveAccountId(req);
  if (accountId === null) {
    res.status(401).json({ error: 'not authenticated' });
    return;
  }

  const id = parseFileId(req.params.id);
  if (id === null) {
    res.status(400).json({ error: 'id must be a positive integer' });
    return;
  }

  try {
    const db = getDb();
    const file = findFileById(db, id);
    if (!file) {
      res.status(404).json({ error: 'download file not found' });
      return;
    }

    const media = findMediaById(db, file[DOWNLOAD_MEDIA_ID]);
    if (!media || media[ACCOUNT_ID] !== accountId) {
      res.status(404).json({ error: 'download file not found' });
      return;
    }

    if (media[STATUS] !== STATUSES.COMPLETED) {
      res.status(409).json({ error: 'download media is not completed' });
      return;
    }

    const diskFileName = file[DISK_FILE_NAME];
    if (!diskFileName || typeof diskFileName !== 'string') {
      res.status(404).json({ error: 'download file not found' });
      return;
    }

    const safeName = path.basename(diskFileName);
    if (!safeName || safeName !== diskFileName) {
      res.status(404).json({ error: 'download file not found' });
      return;
    }

    const absPath = path.join(mediaDirFor(media[SOURCE], media[SITE]), safeName);
    let stats;
    try {
      stats = fs.statSync(absPath);
    } catch (error) {
      if (error?.code === 'ENOENT') {
        res.status(404).json({ error: 'download file not found' });
        return;
      }
      throw error;
    }

    if (!stats.isFile()) {
      res.status(404).json({ error: 'download file not found' });
      return;
    }

    const downloadName = sanitizeOriginalFileName(file[ORIGINAL_FILE_NAME]);

    res.download(absPath, downloadName, (error) => {
      if (!error || res.headersSent) {
        return;
      }
      res.status(500).json({ error: error.message });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export default {
  mediaDownload,
};
