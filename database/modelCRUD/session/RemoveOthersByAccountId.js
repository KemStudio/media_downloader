import { DATA, ID, TABLE_NAME } from '../../model/Session.js';

const ACCOUNT_ID_JSON_PATH = '$.accountId';

export function removeOthersByAccountId(db, accountId, currentSessionId) {
  const result = db
    .prepare(
      `DELETE FROM ${TABLE_NAME}
       WHERE CAST(json_extract(${DATA}, '${ACCOUNT_ID_JSON_PATH}') AS INTEGER) = ?
         AND ${ID} != ?`,
    )
    .run(accountId, currentSessionId);

  return result.changes;
}
