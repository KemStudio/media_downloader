import { IS_ACTIVE } from '../../model/Account.js';
import { update } from './Update.js';

export function remove(db, id) {
  return update(db, id, { [IS_ACTIVE]: false });
}
