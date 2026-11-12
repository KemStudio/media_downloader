import { getDb } from '../../database/DataManager.js';
import { DATA, EXPIRES_AT } from '../../database/model/Session.js';
import { findById } from '../../database/modelCRUD/session/FindById.js';
import { remove } from '../../database/modelCRUD/session/Remove.js';
import {
  ACCOUNT_ID_SESSION_KEY,
  isExpired,
  parseSessionData,
  sameAccountId,
} from '../utils/session.js';

export function logoutSession(req, res) {
  const id =
    typeof req.params.id === 'string' ? req.params.id.trim() : String(req.params.id ?? '').trim();

  if (!id) {
    res.status(400).json({ error: 'id is required' });
    return;
  }

  if (id === req.sessionID) {
    res.status(400).json({ error: 'cannot logout current session' });
    return;
  }

  try {
    const db = getDb();
    const row = findById(db, id);

    if (!row || isExpired(row[EXPIRES_AT])) {
      res.status(404).json({ error: 'session not found' });
      return;
    }

    const data = parseSessionData(row[DATA]);
    const accountId = req.session[ACCOUNT_ID_SESSION_KEY];

    if (!sameAccountId(data[ACCOUNT_ID_SESSION_KEY], accountId)) {
      res.status(404).json({ error: 'session not found' });
      return;
    }

    remove(db, id);
    res.status(200).json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export default {
  logoutSession,
};
