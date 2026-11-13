import { getDb } from '../../database/DataManager.js';
import { findByAccountId } from '../../database/modelCRUD/session/FindByAccountId.js';
import {
  ACCOUNT_ID_SESSION_KEY,
  SESSIONS_PAGE_LIMIT,
  parseStartIndex,
  toSessionItem,
} from '../utils/session.js';

export function list(req, res) {
  const startIndex = parseStartIndex(req.query.start_index);

  if (startIndex === null) {
    res.status(400).json({ error: 'start_index must be a non-negative integer' });
    return;
  }

  try {
    const accountId = req.session[ACCOUNT_ID_SESSION_KEY];
    const { sessions } = findByAccountId(getDb(), accountId, {
      limit: SESSIONS_PAGE_LIMIT,
      offset: startIndex,
    });

    res.status(200).json({
      sessions: sessions.map((row) => toSessionItem(row, req.sessionID)),
      start_index: startIndex,
      limit: SESSIONS_PAGE_LIMIT,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export default {
  list,
};
