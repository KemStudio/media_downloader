import path from 'node:path';
import {
  DISK_FILE_NAME,
  DOWNLOAD_MEDIA_ID,
  ORIGINAL_FILE_NAME,
  TABLE_NAME,
} from '../../model/DownloadFile.js';
import { findById } from './FindById.js';

function optionalText(value, fieldName) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== 'string') {
    throw new Error(`${fieldName} must be a string or null`);
  }

  const trimmed = value.trim();
  return trimmed || null;
}

function optionalDiskFileName(value) {
  const name = optionalText(value, DISK_FILE_NAME);
  if (name === null) {
    return null;
  }

  if (name !== path.basename(name)) {
    throw new Error('disk_file_name is invalid');
  }

  return name;
}

export function create(db, {
  [DOWNLOAD_MEDIA_ID]: downloadMediaId,
  [DISK_FILE_NAME]: diskFileName = null,
  [ORIGINAL_FILE_NAME]: originalFileName = null,
}) {
  if (!Number.isInteger(downloadMediaId) || downloadMediaId < 1) {
    throw new Error('download_media_id must be a positive integer');
  }

  const result = db
    .prepare(
      `INSERT INTO ${TABLE_NAME} (
         ${DOWNLOAD_MEDIA_ID},
         ${DISK_FILE_NAME},
         ${ORIGINAL_FILE_NAME}
       )
       VALUES (?, ?, ?)`,
    )
    .run(
      downloadMediaId,
      optionalDiskFileName(diskFileName),
      optionalText(originalFileName, ORIGINAL_FILE_NAME),
    );

  return findById(db, Number(result.lastInsertRowid));
}

export default {
  create,
};
