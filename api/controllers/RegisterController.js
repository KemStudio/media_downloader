import { getDb } from '../../database/DataManager.js';
import {
  ROLES,
  USERNAME,
} from '../../database/model/Account.js';
import { create } from '../../database/modelCRUD/account/Create.js';
import { toPublicAccount } from '../utils/account.js';
import { isUniqueConstraintError } from '../utils/errors.js';
import { setSessionAccount } from '../utils/session.js';

export function register(req, res) {
  const username = req.body?.username;
  const password = req.body?.password;

  try {
    const db = getDb();
    const account = create(db, {
      [USERNAME]: username,
      password,
      role: ROLES.USER,
    });

    setSessionAccount(req, account, {
      userAgent: req.get('user-agent'),
      ip: req.ip,
    });
    res.status(201).json({ account: toPublicAccount(account) });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      res.status(409).json({ error: 'username already exists' });
      return;
    }

    res.status(400).json({ error: error.message });
  }
}

export default {
  register,
};
