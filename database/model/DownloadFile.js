import { ID as MEDIA_ID, TABLE_NAME as MEDIA_TABLE } from './DownloadMedia.js';

export const TABLE_NAME = 'download_file';

export const ID = 'id';
export const DOWNLOAD_MEDIA_ID = 'download_media_id';
export const DISK_FILE_NAME = 'disk_file_name';
export const ORIGINAL_FILE_NAME = 'original_file_name';

export const FIELDS = Object.freeze({
  ID,
  DOWNLOAD_MEDIA_ID,
  DISK_FILE_NAME,
  ORIGINAL_FILE_NAME,
});

export const createTableSQL = `
CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
  ${ID} INTEGER PRIMARY KEY AUTOINCREMENT,
  ${DOWNLOAD_MEDIA_ID} INTEGER NOT NULL REFERENCES ${MEDIA_TABLE}(${MEDIA_ID}) ON DELETE CASCADE,
  ${DISK_FILE_NAME} TEXT NULL UNIQUE,
  ${ORIGINAL_FILE_NAME} TEXT NULL
);

CREATE INDEX IF NOT EXISTS idx_download_file_download_media_id
  ON ${TABLE_NAME} (${DOWNLOAD_MEDIA_ID});
`;
