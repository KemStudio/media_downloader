import {
  ACCOUNT_ID,
  NAME,
  STATE,
  STATES,
  TABLE_NAME,
  TOKEN_HASH,
  TOKEN_PREFIX,
} from '../../model/AccessToken.js';
import { assertState } from './AssertState.js';
import { findById } from './FindById.js';
import {
  generateTokenSecret,
  hashToken,
  tokenPrefixFromSecret,
} from './TokenSecret.js';

export function create(db, {
  [ACCOUNT_ID]: accountId,
  [NAME]: name,
  [STATE]: state = STATES.ACTIVE,
}) {
  if (!Number.isInteger(accountId) || accountId < 1) {
    throw new Error('account_id must be a positive integer');
  }

  if (typeof name !== 'string' || !name.trim()) {
    throw new Error('name is required');
  }

  assertState(state);

  const plainToken = generateTokenSecret();
  const tokenHash = hashToken(plainToken);
  const tokenPrefix = tokenPrefixFromSecret(plainToken);

  const result = db
    .prepare(
      `INSERT INTO ${TABLE_NAME} (${ACCOUNT_ID}, ${NAME}, ${TOKEN_HASH}, ${TOKEN_PREFIX}, ${STATE})
       VALUES (?, ?, ?, ?, ?)`,
    )
    .run(accountId, name.trim(), tokenHash, tokenPrefix, state);

  return {
    accessToken: findById(db, result.lastInsertRowid),
    token: plainToken,
  };
}
