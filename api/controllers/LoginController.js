import { getDb } from '../../database/DataManager.js';
import {
  IS_ACTIVE,
  PASSWORD_HASH,
} from '../../database/model/Account.js';
import { findByUsername } from '../../database/modelCRUD/account/FindByUsername.js';
import { verifyPassword } from '../../database/modelCRUD/account/Password.js';
import { toPublicAccount } from '../utils/account.js';
import { setSessionAccount } from '../utils/session.js';

export function login(req, res) {
  const username = req.body?.username;
  const password = req.body?.password;

  if (!username || !password) {
    res.status(400).json({ error: 'username and password are required' });
    return;
  }

  try {
    const db = getDb();
    const account = findByUsername(db, username);

    if (!account || !account[IS_ACTIVE] || !verifyPassword(password, account[PASSWORD_HASH])) {
      res.status(401).json({ error: 'invalid username or password' });
      return;
    }

    setSessionAccount(req, account);
    res.status(200).json({ account: toPublicAccount(account) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export default {
  login,
};
