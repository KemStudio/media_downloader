import {
  ACCOUNT_ID_SESSION_KEY,
  touchSessionLastSeen,
} from '../utils/session.js';

export function requireApiAuth(req, res, next) {
  if (!req.session?.[ACCOUNT_ID_SESSION_KEY]) {
    res.status(401).json({ error: 'not authenticated' });
    return;
  }

  touchSessionLastSeen(req);
  next();
}

export default {
  requireApiAuth,
};
