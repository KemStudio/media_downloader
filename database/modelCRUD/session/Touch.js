import { EXPIRES_AT, ID, TABLE_NAME } from '../../model/Session.js';

export function touch(db, id, expiresAt) {
  db.prepare(
    `UPDATE ${TABLE_NAME}
     SET ${EXPIRES_AT} = ?
     WHERE ${ID} = ?`,
  ).run(expiresAt, id);
}
