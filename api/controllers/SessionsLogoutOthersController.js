import { getDb } from '../../database/DataManager.js';
import { removeOthersByAccountId } from '../../database/modelCRUD/session/RemoveOthersByAccountId.js';
import { ACCOUNT_ID_SESSION_KEY } from '../utils/session.js';

export function logoutOthers(req, res) {
  try {
    const accountId = req.session[ACCOUNT_ID_SESSION_KEY];
    const revoked = removeOthersByAccountId(getDb(), accountId, req.sessionID);
    res.status(200).json({ revoked });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export default {
  logoutOthers,
};
