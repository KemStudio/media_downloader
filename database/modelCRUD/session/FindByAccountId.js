import { DATA, EXPIRES_AT, ID, TABLE_NAME } from '../../model/Session.js';

const ACCOUNT_ID_JSON_PATH = '$.accountId';
const LAST_SEEN_AT_JSON_PATH = '$.lastSeenAt';
const CREATED_AT_JSON_PATH = '$.createdAt';

export function findByAccountId(
  db,
  accountId,
  { limit, offset, nowIso = new Date().toISOString() } = {},
) {
  if (!Number.isInteger(limit) || limit < 1) {
    throw new Error('limit must be a positive integer');
  }

  if (!Number.isInteger(offset) || offset < 0) {
    throw new Error('offset must be a non-negative integer');
  }

  const whereClause = `
    CAST(json_extract(${DATA}, '${ACCOUNT_ID_JSON_PATH}') AS INTEGER) = ?
    AND ${EXPIRES_AT} > ?
  `;

  const rows = db
    .prepare(
      `SELECT ${ID}, ${DATA}, ${EXPIRES_AT}
       FROM ${TABLE_NAME}
       WHERE ${whereClause}
       ORDER BY COALESCE(
         json_extract(${DATA}, '${LAST_SEEN_AT_JSON_PATH}'),
         json_extract(${DATA}, '${CREATED_AT_JSON_PATH}')
       ) DESC
       LIMIT ? OFFSET ?`,
    )
    .all(accountId, nowIso, limit, offset);

  return {
    sessions: rows.map((row) => ({
      [ID]: row[ID],
      [DATA]: row[DATA],
      [EXPIRES_AT]: row[EXPIRES_AT],
    })),
  };
}
