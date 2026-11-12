import {
  DOWNLOAD_MEDIA_ID,
  ID,
  TABLE_NAME,
} from '../../model/DownloadFile.js';
import { mapDownloadFile } from './MapDownloadFile.js';

export function findByMediaId(db, downloadMediaId) {
  if (!Number.isInteger(downloadMediaId) || downloadMediaId < 1) {
    throw new Error('download_media_id must be a positive integer');
  }

  const rows = db
    .prepare(
      `SELECT *
       FROM ${TABLE_NAME}
       WHERE ${DOWNLOAD_MEDIA_ID} = ?
       ORDER BY ${ID} ASC`,
    )
    .all(downloadMediaId);

  return rows.map((row) => mapDownloadFile(row));
}

export default {
  findByMediaId,
};
