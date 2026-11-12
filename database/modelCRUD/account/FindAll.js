import { ID, TABLE_NAME } from '../../model/Account.js';
import { mapAccount } from './MapAccount.js';

export function findAll(db) {
  const rows = db
    .prepare(`SELECT * FROM ${TABLE_NAME} ORDER BY ${ID} ASC`)
    .all();

  return rows.map(mapAccount);
}
