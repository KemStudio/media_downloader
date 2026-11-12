import {
  ACCOUNT_ID,
  ORIGINAL_FILE_NAME,
  SITE,
  SOURCE,
  STATUS,
  STATUSES,
  TABLE_NAME,
  URL,
} from '../../model/DownloadMedia.js';
import { findById } from './FindById.js';

export function create(db, {
  [ACCOUNT_ID]: accountId,
  [SOURCE]: source,
  [SITE]: site,
  [URL]: url,
  [STATUS]: status = STATUSES.PENDING,
  [ORIGINAL_FILE_NAME]: originalFileName = null,
}) {
  if (!Number.isInteger(accountId) || accountId < 1) {
    throw new Error('account_id must be a positive integer');
  }

  if (typeof source !== 'string' || !source.trim()) {
    throw new Error('source is required');
  }

  if (typeof site !== 'string' || !site.trim()) {
    throw new Error('site is required');
  }

  if (typeof url !== 'string' || !url.trim()) {
    throw new Error('url is required');
  }

  if (!Object.values(STATUSES).includes(status)) {
    throw new Error('status is invalid');
  }

  if (
    originalFileName !== null
    && (typeof originalFileName !== 'string' || !originalFileName.trim())
  ) {
    throw new Error('original_file_name must be a non-empty string or null');
  }

  const result = db
    .prepare(
      `INSERT INTO ${TABLE_NAME} (
         ${ACCOUNT_ID},
         ${SOURCE},
         ${SITE},
         ${URL},
         ${STATUS},
         ${ORIGINAL_FILE_NAME}
       )
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(
      accountId,
      source.trim(),
      site.trim(),
      url.trim(),
      status,
      originalFileName == null ? null : originalFileName.trim(),
    );

  return findById(db, Number(result.lastInsertRowid));
}

export default {
  create,
};
