export const TABLE_NAME = 'access_token';

export const ID = 'id';
export const ACCOUNT_ID = 'account_id';
export const NAME = 'name';
export const TOKEN_HASH = 'token_hash';
export const TOKEN_PREFIX = 'token_prefix';
export const STATE = 'state';
export const CREATED_AT = 'created_at';
export const UPDATED_AT = 'updated_at';

export const FIELDS = Object.freeze({
  ID,
  ACCOUNT_ID,
  NAME,
  TOKEN_HASH,
  TOKEN_PREFIX,
  STATE,
  CREATED_AT,
  UPDATED_AT,
});

export const STATES = Object.freeze({
  ACTIVE: 'active',
  DEACTIVE: 'deactive',
  HIDE: 'hide',
});

export const createTableSQL = `
CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
  ${ID} INTEGER PRIMARY KEY AUTOINCREMENT,
  ${ACCOUNT_ID} INTEGER NOT NULL REFERENCES account(id) ON DELETE CASCADE,
  ${NAME} TEXT NOT NULL,
  ${TOKEN_HASH} TEXT NOT NULL,
  ${TOKEN_PREFIX} TEXT NOT NULL,
  ${STATE} TEXT NOT NULL DEFAULT '${STATES.ACTIVE}'
    CHECK (${STATE} IN ('${STATES.ACTIVE}', '${STATES.DEACTIVE}', '${STATES.HIDE}')),
  ${CREATED_AT} TEXT NOT NULL DEFAULT (datetime('now')),
  ${UPDATED_AT} TEXT NOT NULL DEFAULT (datetime('now'))
);
`;
