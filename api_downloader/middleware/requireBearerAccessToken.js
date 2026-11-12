import { getDb } from '../../database/DataManager.js';
import {
  ACCOUNT_ID,
  ID as ACCESS_TOKEN_ID,
  TOKEN_HASH,
} from '../../database/model/AccessToken.js';
import {
  ID as ACCOUNT_ID_FIELD,
  STATE,
  STATES,
  isAccountAccessible,
} from '../../database/model/Account.js';
import { findActiveByPrefix } from '../../database/modelCRUD/accessToken/FindActiveByPrefix.js';
import {
  tokenPrefixFromSecret,
  verifyToken,
} from '../../database/modelCRUD/accessToken/TokenSecret.js';
import { findById as findAccountById } from '../../database/modelCRUD/account/FindById.js';

const BEARER_PREFIX = 'Bearer ';

function extractBearerToken(authorization) {
  if (typeof authorization !== 'string') {
    return null;
  }

  const value = authorization.trim();
  if (!value.toLowerCase().startsWith(BEARER_PREFIX.toLowerCase())) {
    return null;
  }

  const token = value.slice(BEARER_PREFIX.length).trim();
  return token || null;
}

export function requireBearerAccessToken(req, res, next) {
  const token = extractBearerToken(req.get('authorization'));
  if (!token) {
    res.status(401).json({ error: 'missing or invalid bearer token' });
    return;
  }

  try {
    const db = getDb();
    const prefix = tokenPrefixFromSecret(token);
    const candidates = findActiveByPrefix(db, prefix);

    let matched = null;
    for (const accessToken of candidates) {
      if (verifyToken(token, accessToken[TOKEN_HASH])) {
        matched = accessToken;
        break;
      }
    }

    if (!matched) {
      res.status(401).json({ error: 'invalid bearer token' });
      return;
    }

    const account = findAccountById(db, matched[ACCOUNT_ID]);
    if (
      !account
      || !isAccountAccessible(account[STATE])
      || account[STATE] !== STATES.ACTIVE
    ) {
      res.status(401).json({ error: 'invalid bearer token' });
      return;
    }

    req.accessToken = matched;
    req.account = account;
    req.accountId = account[ACCOUNT_ID_FIELD];
    req.accessTokenId = matched[ACCESS_TOKEN_ID];
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export default {
  requireBearerAccessToken,
};
