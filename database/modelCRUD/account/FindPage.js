import { ID, STATE, TABLE_NAME } from '../../model/Account.js';
import { assertState } from './AssertState.js';
import { mapAccount } from './MapAccount.js';

export function findPage(db, { states, limit, offset } = {}) {
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
  const whereClause = `${STATE} IN (${placeholders})`;

  const totalRow = db
    .prepare(
      `SELECT COUNT(*) AS count
       FROM ${TABLE_NAME}
       WHERE ${whereClause}`,
    )
    .get(...states);

  const rows = db
    .prepare(
      `SELECT *
       FROM ${TABLE_NAME}
       WHERE ${whereClause}
       ORDER BY ${ID} ASC
       LIMIT ? OFFSET ?`,
    )
    .all(...states, limit, offset);

  return {
    accounts: rows.map(mapAccount),
    total: totalRow?.count ?? 0,
  };
}
