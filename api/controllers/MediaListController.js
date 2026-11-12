import { MEDIA_PAGE_LIMIT } from '../../api_downloader/Setting.js';
import { getDb } from '../../database/DataManager.js';
import {
  ID as FILE_ID,
  ORIGINAL_FILE_NAME,
} from '../../database/model/DownloadFile.js';
import {
  ACCOUNT_ID,
  STATUS,
  STATUSES,
} from '../../database/model/DownloadMedia.js';
import { findByMediaId } from '../../database/modelCRUD/downloadFile/FindByMediaId.js';
import { findById } from '../../database/modelCRUD/downloadMedia/FindById.js';
import { findPageByAccountId } from '../../database/modelCRUD/downloadMedia/FindPageByAccountId.js';
import {
  ACCOUNT_ID_SESSION_KEY,
  parseStartIndex,
} from '../utils/session.js';

const VALID_STATUSES = new Set(Object.values(STATUSES));
const ALL_STATUSES = Object.values(STATUSES);

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

function parseStatusesQuery(raw) {
  if (raw === undefined || raw === null || raw === '') {
    return ALL_STATUSES;
  }

  const chunks = Array.isArray(raw) ? raw : [raw];
  const statuses = [];
  const seen = new Set();

  for (const chunk of chunks) {
    if (typeof chunk !== 'string' && typeof chunk !== 'number') {
      return null;
    }

    for (const part of String(chunk).split(',')) {
      const status = part.trim();
      if (!status) {
        continue;
      }

      if (!VALID_STATUSES.has(status)) {
        return null;
      }

      if (!seen.has(status)) {
        seen.add(status);
        statuses.push(status);
      }
    }
  }

  if (statuses.length === 0) {
    return null;
  }

  return statuses;
}

function parsePage(raw) {
  if (raw === undefined || raw === null || raw === '') {
    return 1;
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

export function list(req, res) {
  const accountId = resolveAccountId(req);
  if (accountId === null) {
    res.status(401).json({ error: 'not authenticated' });
    return;
  }

  const page = parsePage(req.query.page);
  if (page === null) {
    res.status(400).json({ error: 'page must be a positive integer' });
    return;
  }

  const statuses = parseStatusesQuery(req.query.status);
  if (statuses === null) {
    res.status(400).json({
      error: 'status must be one or more of: pending, downloading, completed, failed',
    });
    return;
  }

  // Optional start_index for clients that prefer offset pagination.
  let offset;
  if (req.query.start_index !== undefined && req.query.start_index !== null && req.query.start_index !== '') {
    offset = parseStartIndex(req.query.start_index);
    if (offset === null) {
      res.status(400).json({ error: 'start_index must be a non-negative integer' });
      return;
    }
  } else {
    offset = (page - 1) * MEDIA_PAGE_LIMIT;
  }

  try {
    const { downloadMedia, total } = findPageByAccountId(getDb(), accountId, {
      statuses,
      limit: MEDIA_PAGE_LIMIT,
      offset,
    });

    res.status(200).json({
      download_media: downloadMedia,
      page,
      start_index: offset,
      limit: MEDIA_PAGE_LIMIT,
      total,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export function listFiles(req, res) {
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

    const files = findByMediaId(getDb(), id).map((file) => ({
      [FILE_ID]: file[FILE_ID],
      [ORIGINAL_FILE_NAME]: file[ORIGINAL_FILE_NAME],
    }));

    res.status(200).json({ files });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export default {
  list,
  listFiles,
};
