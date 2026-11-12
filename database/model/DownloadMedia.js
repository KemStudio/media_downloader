export const TABLE_NAME = 'download_media';

export const ID = 'id';
export const ACCOUNT_ID = 'account_id';
export const SOURCE = 'source';
export const SITE = 'site';
export const URL = 'url';
export const STATUS = 'status';
export const ERROR_MESSAGE = 'error_message';
export const CREATED_AT = 'created_at';
export const UPDATED_AT = 'updated_at';
export const STARTED_AT = 'started_at';
export const FINISHED_AT = 'finished_at';

export const FIELDS = Object.freeze({
  ID,
  ACCOUNT_ID,
  SOURCE,
  SITE,
  URL,
  STATUS,
  ERROR_MESSAGE,
  CREATED_AT,
  UPDATED_AT,
  STARTED_AT,
  FINISHED_AT,
});

export const STATUSES = Object.freeze({
  PENDING: 'pending',
  DOWNLOADING: 'downloading',
  COMPLETED: 'completed',
  FAILED: 'failed',
});

export const createTableSQL = `
CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
  ${ID} INTEGER PRIMARY KEY AUTOINCREMENT,
  ${ACCOUNT_ID} INTEGER NOT NULL REFERENCES account(id) ON DELETE CASCADE,
  ${SOURCE} TEXT NOT NULL,
  ${SITE} TEXT NOT NULL,
  ${URL} TEXT NOT NULL,
  ${STATUS} TEXT NOT NULL DEFAULT '${STATUSES.PENDING}'
    CHECK (${STATUS} IN (
      '${STATUSES.PENDING}',
      '${STATUSES.DOWNLOADING}',
      '${STATUSES.COMPLETED}',
      '${STATUSES.FAILED}'
    )),
  ${ERROR_MESSAGE} TEXT NULL,
  ${CREATED_AT} TEXT NOT NULL DEFAULT (datetime('now')),
  ${UPDATED_AT} TEXT NOT NULL DEFAULT (datetime('now')),
  ${STARTED_AT} TEXT NULL,
  ${FINISHED_AT} TEXT NULL
);

CREATE INDEX IF NOT EXISTS idx_download_media_account_created
  ON ${TABLE_NAME} (${ACCOUNT_ID}, ${CREATED_AT} DESC, ${ID} DESC);

CREATE INDEX IF NOT EXISTS idx_download_media_status_created
  ON ${TABLE_NAME} (${STATUS}, ${CREATED_AT} ASC, ${ID} ASC);
`;
