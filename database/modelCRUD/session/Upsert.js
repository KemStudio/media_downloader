import { DATA, EXPIRES_AT, ID, TABLE_NAME } from '../../model/Session.js';

export function upsert(db, { [ID]: id, [DATA]: data, [EXPIRES_AT]: expiresAt }) {
  db.prepare(
    `INSERT INTO ${TABLE_NAME} (${ID}, ${DATA}, ${EXPIRES_AT})
     VALUES (?, ?, ?)
     ON CONFLICT(${ID}) DO UPDATE SET
       ${DATA} = excluded.${DATA},
       ${EXPIRES_AT} = excluded.${EXPIRES_AT}`,
  ).run(id, data, expiresAt);
}
