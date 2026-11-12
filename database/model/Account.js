export const TABLE_NAME = 'account';

export const ID = 'id';
export const USERNAME = 'username';
export const PASSWORD_HASH = 'password_hash';
export const ROLE = 'role';
export const STATE = 'state';
export const CREATED_AT = 'created_at';
export const UPDATED_AT = 'updated_at';

export const FIELDS = Object.freeze({
  ID,
  USERNAME,
  PASSWORD_HASH,
  ROLE,
  STATE,
  CREATED_AT,
  UPDATED_AT,
});

export const ROLES = Object.freeze({
  ROOT: 'root',
  ADMIN: 'admin',
  USER: 'user',
});

export const STATES = Object.freeze({
  ACTIVE: 'active',
  DEACTIVE: 'deactive',
  HIDE: 'hide',
});

export function isAccountAccessible(state) {
  return state !== STATES.HIDE;
}

export const createTableSQL = `
CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
  ${ID} INTEGER PRIMARY KEY AUTOINCREMENT,
  ${USERNAME} TEXT NOT NULL UNIQUE,
  ${PASSWORD_HASH} TEXT NOT NULL,
  ${ROLE} TEXT NOT NULL DEFAULT '${ROLES.USER}'
    CHECK (${ROLE} IN ('${ROLES.ROOT}', '${ROLES.ADMIN}', '${ROLES.USER}')),
  ${STATE} TEXT NOT NULL DEFAULT '${STATES.ACTIVE}'
    CHECK (${STATE} IN ('${STATES.ACTIVE}', '${STATES.DEACTIVE}', '${STATES.HIDE}')),
  ${CREATED_AT} TEXT NOT NULL DEFAULT (datetime('now')),
  ${UPDATED_AT} TEXT NOT NULL DEFAULT (datetime('now'))
);
`;
