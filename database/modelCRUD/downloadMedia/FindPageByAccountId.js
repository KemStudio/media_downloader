import {
  ACCOUNT_ID,
  ID,
  STATUS,
  STATUSES,
  TABLE_NAME,
} from '../../model/DownloadMedia.js';
import { mapDownloadMedia } from './MapDownloadMedia.js';

export function findPageByAccountId(db, accountId, { statuses, limit, offset } = {}) {
  if (!Number.isInteger(accountId) || accountId < 1) {
    throw new Error('account_id must be a positive integer');
  }

  if (!Array.isArray(statuses) || statuses.length === 0) {
    throw new Error('statuses must be a non-empty array');
  }

  const validStatuses = new Set(Object.values(STATUSES));
  for (const status of statuses) {
    if (!validStatuses.has(status)) {
      throw new Error('status is invalid');
    }
  }

  if (!Number.isInteger(limit) || limit < 1) {
    throw new Error('limit must be a positive integer');
  }

  if (!Number.isInteger(offset) || offset < 0) {
    throw new Error('offset must be a non-negative integer');
  }

  const placeholders = statuses.map(() => '?').join(', ');
  const whereClause = `${ACCOUNT_ID} = ? AND ${STATUS} IN (${placeholders})`;
  const params = [accountId, ...statuses];

  const rows = db
    .prepare(
      `SELECT *
       FROM ${TABLE_NAME}
       WHERE ${whereClause}
       ORDER BY ${ID} DESC
       LIMIT ? OFFSET ?`,
    )
    .all(...params, limit, offset);

  return {
    downloadMedia: rows.map(mapDownloadMedia),
  };
}

export default {
  findPageByAccountId,
};
