import { DATA, EXPIRES_AT, ID, TABLE_NAME } from '../../model/Session.js';

export function findById(db, id) {
  const row = db
    .prepare(
      `SELECT ${ID}, ${DATA}, ${EXPIRES_AT}
       FROM ${TABLE_NAME}
       WHERE ${ID} = ?`,
    )
    .get(id);

  if (!row) {
    return null;
  }

  return {
    [ID]: row[ID],
    [DATA]: row[DATA],
    [EXPIRES_AT]: row[EXPIRES_AT],
  };
}
