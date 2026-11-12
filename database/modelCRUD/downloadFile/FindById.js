import { ID, TABLE_NAME } from '../../model/DownloadFile.js';
import { mapDownloadFile } from './MapDownloadFile.js';

export function findById(db, id) {
  if (!Number.isInteger(id) || id < 1) {
    throw new Error('id must be a positive integer');
  }

  const row = db
    .prepare(
      `SELECT *
       FROM ${TABLE_NAME}
       WHERE ${ID} = ?`,
    )
    .get(id);

  return mapDownloadFile(row);
}

export default {
  findById,
};
