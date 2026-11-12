import { LOGOUT } from '../../api/ApiUrl.js';
import { ROLE, ROLES } from '../../database/model/Account.js';
import {
  ACCESS_TOKENS,
  ACCOUNTS,
  CHANGE_PASSWORD,
  CRON_JOBS,
  DOWNLOADS,
  HOME,
  LOGIN,
  SESSIONS,
} from '../HomeUrl.js';

export function appNavLocals(req, res, next) {
  const role = res.locals.account?.[ROLE];
  const canManageAccounts = role === ROLES.ROOT || role === ROLES.ADMIN;

  res.locals.homePath = HOME;
  res.locals.downloadsPath = DOWNLOADS;
  res.locals.accountsPath = ACCOUNTS;
  res.locals.cronJobsPath = CRON_JOBS;
  res.locals.sessionsPath = SESSIONS;
  res.locals.accessTokensPath = ACCESS_TOKENS;
  res.locals.changePasswordPath = CHANGE_PASSWORD;
  res.locals.loginPath = LOGIN;
  res.locals.logoutEndpoint = LOGOUT;
  res.locals.canManageAccounts = canManageAccounts;
  res.locals.canManageCronJobs = canManageAccounts;
  res.locals.currentPath = req.path;

  next();
}

export default {
  appNavLocals,
};
