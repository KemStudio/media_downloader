import { DATA, TABLE_NAME } from '../../model/Session.js';

const ACCOUNT_ID_JSON_PATH = '$.accountId';

export function removeByAccountId(db, accountId) {
  const result = db
    .prepare(
      `DELETE FROM ${TABLE_NAME}
       WHERE CAST(json_extract(${DATA}, '${ACCOUNT_ID_JSON_PATH}') AS INTEGER) = ?`,
    )
    .run(accountId);

  return result.changes;
}
