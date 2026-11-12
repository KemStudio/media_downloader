import { ID, TABLE_NAME } from '../../model/Account.js';
import { mapAccount } from './MapAccount.js';

export function findById(db, id) {
  const row = db
    .prepare(`SELECT * FROM ${TABLE_NAME} WHERE ${ID} = ?`)
    .get(id);

  return mapAccount(row);
}
