export const TABLE_NAME = 'session';

export const ID = 'id';
export const DATA = 'data';
export const EXPIRES_AT = 'expires_at';

export const FIELDS = Object.freeze({
  ID,
  DATA,
  EXPIRES_AT,
});

export const createTableSQL = `
CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
  ${ID} TEXT PRIMARY KEY NOT NULL,
  ${DATA} TEXT NOT NULL,
  ${EXPIRES_AT} TEXT NOT NULL
);
`;
