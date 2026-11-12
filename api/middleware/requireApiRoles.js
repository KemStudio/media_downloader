import { getDb } from '../../database/DataManager.js';
import {
  ROLE,
  STATE,
  isAccountAccessible,
} from '../../database/model/Account.js';
import { findById } from '../../database/modelCRUD/account/FindById.js';
import {
  ACCOUNT_ID_SESSION_KEY,
  touchSessionLastSeen,
} from '../utils/session.js';

export function requireApiRoles(...roles) {
  const allowedRoles = new Set(roles);

  return (req, res, next) => {
    if (!req.session?.[ACCOUNT_ID_SESSION_KEY]) {
      res.status(401).json({ error: 'not authenticated' });
      return;
    }

    touchSessionLastSeen(req);

    try {
      const account = findById(getDb(), req.session[ACCOUNT_ID_SESSION_KEY]);

      if (!account || !isAccountAccessible(account[STATE])) {
        delete req.session[ACCOUNT_ID_SESSION_KEY];
        res.status(401).json({ error: 'not authenticated' });
        return;
      }

      if (!allowedRoles.has(account[ROLE])) {
        res.status(403).json({ error: 'forbidden' });
        return;
      }

      req.account = account;
      next();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
}

export default {
  requireApiRoles,
};
