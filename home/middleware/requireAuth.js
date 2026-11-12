import { LOGIN } from '../HomeUrl.js';

export function requireAuth(req, res, next) {
  if (!res.locals.account) {
    res.redirect(LOGIN);
    return;
  }

  next();
}

export default {
  requireAuth,
};
