import { ID, TABLE_NAME } from '../../model/Session.js';

export function remove(db, id) {
  db.prepare(`DELETE FROM ${TABLE_NAME} WHERE ${ID} = ?`).run(id);
}
