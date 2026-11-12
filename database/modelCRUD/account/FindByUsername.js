import { TABLE_NAME, USERNAME } from '../../model/Account.js';
import { mapAccount } from './MapAccount.js';

export function findByUsername(db, username) {
  const row = db
    .prepare(`SELECT * FROM ${TABLE_NAME} WHERE ${USERNAME} = ?`)
    .get(username);

  return mapAccount(row);
}
