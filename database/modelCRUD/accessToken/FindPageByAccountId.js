import {
  ACCOUNT_ID,
  ID,
  STATE,
  TABLE_NAME,
} from '../../model/AccessToken.js';
import { assertState } from './AssertState.js';
import { mapAccessToken } from './MapAccessToken.js';

export function findPageByAccountId(db, accountId, { states, limit, offset } = {}) {
  if (!Number.isInteger(accountId) || accountId < 1) {
    throw new Error('account_id must be a positive integer');
  }

  if (!Array.isArray(states) || states.length === 0) {
    throw new Error('states must be a non-empty array');
  }

  for (const state of states) {
    assertState(state);
  }

  if (!Number.isInteger(limit) || limit < 1) {
    throw new Error('limit must be a positive integer');
  }

  if (!Number.isInteger(offset) || offset < 0) {
    throw new Error('offset must be a non-negative integer');
  }

  const placeholders = states.map(() => '?').join(', ');
  const whereClause = `${ACCOUNT_ID} = ? AND ${STATE} IN (${placeholders})`;
  const params = [accountId, ...states];

  const totalRow = db
    .prepare(
      `SELECT COUNT(*) AS count
       FROM ${TABLE_NAME}
       WHERE ${whereClause}`,
    )
    .get(...params);

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
    accessTokens: rows.map(mapAccessToken),
    total: totalRow?.count ?? 0,
  };
}
