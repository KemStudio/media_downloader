import { getDb } from '../../database/DataManager.js';
import { IS_ACTIVE } from '../../database/model/Account.js';
import { findById } from '../../database/modelCRUD/account/FindById.js';
import { toPublicAccount } from '../../api/utils/account.js';
import {
  ACCOUNT_ID_SESSION_KEY,
  touchSessionLastSeen,
} from '../../api/utils/session.js';

export function loadAccount(req, res, next) {
  res.locals.account = null;

  const accountId = req.session?.[ACCOUNT_ID_SESSION_KEY];
  if (!accountId) {
    next();
    return;
  }

  try {
    const account = findById(getDb(), accountId);

    if (!account || !account[IS_ACTIVE]) {
      delete req.session[ACCOUNT_ID_SESSION_KEY];
      next();
      return;
    }

    touchSessionLastSeen(req);
    res.locals.account = toPublicAccount(account);
  } catch (error) {
    next(error);
    return;
  }

  next();
}

export default {
  loadAccount,
};
