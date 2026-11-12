import { ID } from '../../database/model/Account.js';

export const ACCOUNT_ID_SESSION_KEY = 'accountId';

export function setSessionAccount(req, account) {
  req.session[ACCOUNT_ID_SESSION_KEY] = account[ID];
}

export default {
  ACCOUNT_ID_SESSION_KEY,
  setSessionAccount,
};
