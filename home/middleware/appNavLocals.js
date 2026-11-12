import { LOGOUT } from '../../api/ApiUrl.js';
import { ROLE, ROLES } from '../../database/model/Account.js';
import {
  ACCOUNTS,
  CHANGE_PASSWORD,
  HOME,
  LOGIN,
  SESSIONS,
} from '../HomeUrl.js';

export function appNavLocals(req, res, next) {
  const role = res.locals.account?.[ROLE];

  res.locals.homePath = HOME;
  res.locals.accountsPath = ACCOUNTS;
  res.locals.sessionsPath = SESSIONS;
  res.locals.changePasswordPath = CHANGE_PASSWORD;
  res.locals.loginPath = LOGIN;
  res.locals.logoutEndpoint = LOGOUT;
  res.locals.canManageAccounts = role === ROLES.ROOT || role === ROLES.ADMIN;
  res.locals.currentPath = req.path;

  next();
}

export default {
  appNavLocals,
};
