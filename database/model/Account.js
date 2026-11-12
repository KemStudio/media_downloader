export const TABLE_NAME = 'account';

export const ID = 'id';
export const USERNAME = 'username';
export const PASSWORD_HASH = 'password_hash';
export const ROLE = 'role';
export const IS_ACTIVE = 'is_active';
export const CREATED_AT = 'created_at';
export const UPDATED_AT = 'updated_at';

export const FIELDS = Object.freeze({
  ID,
  USERNAME,
  PASSWORD_HASH,
  ROLE,
  IS_ACTIVE,
  CREATED_AT,
  UPDATED_AT,
});

export const ROLES = Object.freeze({
  ROOT: 'root',
  ADMIN: 'admin',
  USER: 'user',
});

export const createTableSQL = `
CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
  ${ID} INTEGER PRIMARY KEY AUTOINCREMENT,
  ${USERNAME} TEXT NOT NULL UNIQUE,
  ${PASSWORD_HASH} TEXT NOT NULL,
  ${ROLE} TEXT NOT NULL DEFAULT '${ROLES.USER}'
    CHECK (${ROLE} IN ('${ROLES.ROOT}', '${ROLES.ADMIN}', '${ROLES.USER}')),
  ${IS_ACTIVE} INTEGER NOT NULL DEFAULT 1,
  ${CREATED_AT} TEXT NOT NULL DEFAULT (datetime('now')),
  ${UPDATED_AT} TEXT NOT NULL DEFAULT (datetime('now'))
);
`;
