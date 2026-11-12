import { HOME } from '../HomeUrl.js';

export function requireGuest(req, res, next) {
  if (res.locals.account) {
    res.redirect(HOME);
    return;
  }

  next();
}

export default {
  requireGuest,
};
