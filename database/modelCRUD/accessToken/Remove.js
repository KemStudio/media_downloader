import { ID, TABLE_NAME } from '../../model/AccessToken.js';

export function remove(db, id) {
  const result = db
    .prepare(`DELETE FROM ${TABLE_NAME} WHERE ${ID} = ?`)
    .run(id);

  return result.changes > 0;
}
