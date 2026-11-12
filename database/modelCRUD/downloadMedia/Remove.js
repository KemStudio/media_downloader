import { ID, TABLE_NAME } from '../../model/DownloadMedia.js';

export function remove(db, id) {
  if (!Number.isInteger(id) || id < 1) {
    throw new Error('id must be a positive integer');
  }

  const result = db
    .prepare(`DELETE FROM ${TABLE_NAME} WHERE ${ID} = ?`)
    .run(id);

  return result.changes > 0;
}

export default {
  remove,
};
