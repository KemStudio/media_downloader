import { ID, TABLE_NAME } from '../../model/AccessToken.js';
import { mapAccessToken } from './MapAccessToken.js';

export function findById(db, id) {
  const row = db
    .prepare(`SELECT * FROM ${TABLE_NAME} WHERE ${ID} = ?`)
    .get(id);

  return mapAccessToken(row);
}
