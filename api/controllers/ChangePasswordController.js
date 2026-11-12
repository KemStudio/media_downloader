import { getDb } from '../../database/DataManager.js';
import {
  ID,
  IS_ACTIVE,
  PASSWORD_HASH,
} from '../../database/model/Account.js';
import { findById } from '../../database/modelCRUD/account/FindById.js';
import { verifyPassword } from '../../database/modelCRUD/account/Password.js';
import { update } from '../../database/modelCRUD/account/Update.js';
import { assertValidPassword } from '../../database/modelCRUD/account/ValidateCredentials.js';
import { removeOthersByAccountId } from '../../database/modelCRUD/session/RemoveOthersByAccountId.js';
import { ACCOUNT_ID_SESSION_KEY } from '../utils/session.js';

export function changePassword(req, res) {
  const currentPassword = req.body?.currentPassword;
  const newPassword = req.body?.newPassword;

  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: 'currentPassword and newPassword are required' });
    return;
  }

  if (currentPassword === newPassword) {
    res.status(400).json({ error: 'new password must be different from current password' });
    return;
  }

  try {
    assertValidPassword(newPassword);

    const db = getDb();
    const accountId = req.session[ACCOUNT_ID_SESSION_KEY];
    const account = findById(db, accountId);

    if (!account || !account[IS_ACTIVE] || !verifyPassword(currentPassword, account[PASSWORD_HASH])) {
      res.status(401).json({ error: 'invalid current password' });
      return;
    }

    update(db, account[ID], { password: newPassword });
    const revoked = removeOthersByAccountId(db, accountId, req.sessionID);

    res.status(200).json({ revoked });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

export default {
  changePassword,
};
