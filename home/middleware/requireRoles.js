import { ROLE } from '../../database/model/Account.js';
import { HOME, LOGIN } from '../HomeUrl.js';

export function requireRoles(...roles) {
  const allowedRoles = new Set(roles);

  return (req, res, next) => {
    if (!res.locals.account) {
      res.redirect(LOGIN);
      return;
    }

    if (!allowedRoles.has(res.locals.account[ROLE])) {
      res.redirect(HOME);
      return;
    }

    next();
  };
}

export default {
  requireRoles,
};
