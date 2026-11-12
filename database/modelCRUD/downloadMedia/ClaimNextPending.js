import {
  ID,
  STARTED_AT,
  STATUS,
  STATUSES,
  TABLE_NAME,
  UPDATED_AT,
} from '../../model/DownloadMedia.js';
import { findById } from './FindById.js';

export function claimNextPending(db) {
  const pending = db
    .prepare(
      `SELECT ${ID}
       FROM ${TABLE_NAME}
       WHERE ${STATUS} = ?
       ORDER BY ${ID} DESC
       LIMIT 1`,
    )
    .get(STATUSES.PENDING);

  if (!pending) {
    return null;
  }

  const id = Number(pending[ID]);

  const result = db
    .prepare(
      `UPDATE ${TABLE_NAME}
       SET ${STATUS} = ?,
           ${STARTED_AT} = datetime('now'),
           ${UPDATED_AT} = datetime('now')
       WHERE ${ID} = ?
         AND ${STATUS} = ?`,
    )
    .run(STATUSES.DOWNLOADING, id, STATUSES.PENDING);

  if (!result.changes) {
    return null;
  }

  return findById(db, id);
}

export default {
  claimNextPending,
};
