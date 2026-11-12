import { SESSION_COOKIE_NAME } from '../Setting.js';
import { ACCOUNT_ID_SESSION_KEY } from '../utils/session.js';

export function logout(req, res) {
  if (!req.session?.[ACCOUNT_ID_SESSION_KEY]) {
    res.status(401).json({ error: 'not authenticated' });
    return;
  }

  req.session.destroy((error) => {
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.clearCookie(SESSION_COOKIE_NAME);
    res.status(200).json({ ok: true });
  });
}

export default {
  logout,
};
