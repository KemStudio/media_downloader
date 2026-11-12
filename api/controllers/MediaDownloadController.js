import fs from 'node:fs';
import path from 'node:path';
import {
  mediaDirFor,
  sanitizeOriginalFileName,
} from '../../api_downloader/shared/utils/diskFileName.js';
import { getDb } from '../../database/DataManager.js';
import {
  ACCOUNT_ID,
  DISK_FILE_NAME,
  ORIGINAL_FILE_NAME,
  SITE,
  SOURCE,
  STATUS,
  STATUSES,
} from '../../database/model/DownloadMedia.js';
import { findById } from '../../database/modelCRUD/downloadMedia/FindById.js';
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

export function mediaDownload(req, res) {
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
    const media = findById(getDb(), id);
    if (!media || media[ACCOUNT_ID] !== accountId) {
      res.status(404).json({ error: 'download media not found' });
      return;
    }

    if (media[STATUS] !== STATUSES.COMPLETED) {
      res.status(409).json({ error: 'download media is not completed' });
      return;
    }

    const diskFileName = media[DISK_FILE_NAME];
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

    const downloadName = sanitizeOriginalFileName(
      media[ORIGINAL_FILE_NAME] || diskFileName,
    );

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
