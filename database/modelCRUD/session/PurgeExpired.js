import { EXPIRES_AT, TABLE_NAME } from '../../model/Session.js';

export function purgeExpired(db, nowIso = new Date().toISOString()) {
  const result = db
    .prepare(`DELETE FROM ${TABLE_NAME} WHERE ${EXPIRES_AT} <= ?`)
    .run(nowIso);

  return result.changes;
}
