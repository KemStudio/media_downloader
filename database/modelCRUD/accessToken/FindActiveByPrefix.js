import {
  STATE,
  STATES,
  TABLE_NAME,
  TOKEN_PREFIX,
} from '../../model/AccessToken.js';
import { mapAccessToken } from './MapAccessToken.js';

export function findActiveByPrefix(db, tokenPrefix) {
  if (typeof tokenPrefix !== 'string' || !tokenPrefix.trim()) {
    throw new Error('token_prefix is required');
  }

  const rows = db
    .prepare(
      `SELECT *
       FROM ${TABLE_NAME}
       WHERE ${TOKEN_PREFIX} = ?
         AND ${STATE} = ?`,
    )
    .all(tokenPrefix.trim(), STATES.ACTIVE);

  return rows.map(mapAccessToken);
}

export default {
  findActiveByPrefix,
};
