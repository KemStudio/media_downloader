import { getDb } from '../../database/DataManager.js';
import {
  ACCOUNT_ID,
  ID,
  STATE,
  STATES,
} from '../../database/model/AccessToken.js';
import {
  STATE as ACCOUNT_STATE,
  STATES as ACCOUNT_STATES,
} from '../../database/model/Account.js';
import { findById as findAccountById } from '../../database/modelCRUD/account/FindById.js';
import { assertStateTransition } from '../../database/modelCRUD/accessToken/AssertState.js';
import { create } from '../../database/modelCRUD/accessToken/Create.js';
import { findById } from '../../database/modelCRUD/accessToken/FindById.js';
import { findPageByAccountId } from '../../database/modelCRUD/accessToken/FindPageByAccountId.js';
import { remove } from '../../database/modelCRUD/accessToken/Remove.js';
import { update } from '../../database/modelCRUD/accessToken/Update.js';
import {
  ACCESS_TOKENS_PAGE_LIMIT,
  parseAccessTokenId,
  parseStatesQuery,
  toPublicAccessToken,
} from '../utils/accessToken.js';
import {
  ACCOUNT_ID_SESSION_KEY,
  parseStartIndex,
  sameAccountId,
} from '../utils/session.js';

function sessionAccountId(req) {
  const accountId = Number(req.session[ACCOUNT_ID_SESSION_KEY]);
  if (!Number.isInteger(accountId) || accountId < 1) {
    return null;
  }
  return accountId;
}

function findOwnedAccessToken(db, tokenId, accountId) {
  const accessToken = findById(db, tokenId);
  if (!accessToken || !sameAccountId(accessToken[ACCOUNT_ID], accountId)) {
    return null;
  }
  return accessToken;
}

export function list(req, res) {
  const startIndex = parseStartIndex(req.query.start_index);
  const states = parseStatesQuery(req.query.state);

  if (startIndex === null) {
    res.status(400).json({ error: 'start_index must be a non-negative integer' });
    return;
  }

  if (states === null) {
    res.status(400).json({
      error: 'state is required and must be one or more of: active, deactive, hide',
    });
    return;
  }

  const accountId = sessionAccountId(req);
  if (accountId === null) {
    res.status(401).json({ error: 'not authenticated' });
    return;
  }

  try {
    const { accessTokens, total } = findPageByAccountId(getDb(), accountId, {
      states,
      limit: ACCESS_TOKENS_PAGE_LIMIT,
      offset: startIndex,
    });

    res.status(200).json({
      access_tokens: accessTokens.map(toPublicAccessToken),
      start_index: startIndex,
      limit: ACCESS_TOKENS_PAGE_LIMIT,
      total,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export function createAccessToken(req, res) {
  const rawName = req.body?.name;
  const accountId = sessionAccountId(req);

  if (accountId === null) {
    res.status(401).json({ error: 'not authenticated' });
    return;
  }

  if (typeof rawName !== 'string' || !rawName.trim()) {
    res.status(400).json({ error: 'name is required' });
    return;
  }

  try {
    const db = getDb();
    const account = findAccountById(db, accountId);

    if (!account || account[ACCOUNT_STATE] !== ACCOUNT_STATES.ACTIVE) {
      res.status(403).json({
        error: 'only active accounts can create access tokens',
      });
      return;
    }

    const { accessToken, token } = create(db, {
      [ACCOUNT_ID]: accountId,
      name: rawName,
    });

    res.status(201).json({
      access_token: toPublicAccessToken(accessToken),
      token,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

export function updateState(req, res) {
  const tokenId = parseAccessTokenId(req.params.id);
  const nextState = req.body?.state;
  const accountId = sessionAccountId(req);

  if (accountId === null) {
    res.status(401).json({ error: 'not authenticated' });
    return;
  }

  if (tokenId === null) {
    res.status(400).json({ error: 'id must be a positive integer' });
    return;
  }

  if (typeof nextState !== 'string' || !nextState.trim()) {
    res.status(400).json({ error: 'state is required' });
    return;
  }

  try {
    const db = getDb();
    const target = findOwnedAccessToken(db, tokenId, accountId);

    if (!target) {
      res.status(404).json({ error: 'access token not found' });
      return;
    }

    if (target[STATE] === STATES.HIDE) {
      res.status(400).json({ error: 'cannot change state of a hidden access token' });
      return;
    }

    assertStateTransition(target[STATE], nextState);

    const updated = update(db, target[ID], { [STATE]: nextState });

    res.status(200).json({ access_token: toPublicAccessToken(updated) });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

export function removeAccessToken(req, res) {
  const tokenId = parseAccessTokenId(req.params.id);
  const accountId = sessionAccountId(req);

  if (accountId === null) {
    res.status(401).json({ error: 'not authenticated' });
    return;
  }

  if (tokenId === null) {
    res.status(400).json({ error: 'id must be a positive integer' });
    return;
  }

  try {
    const db = getDb();
    const target = findOwnedAccessToken(db, tokenId, accountId);

    if (!target) {
      res.status(404).json({ error: 'access token not found' });
      return;
    }

    if (target[STATE] !== STATES.HIDE) {
      res.status(400).json({ error: 'only hidden access tokens can be deleted' });
      return;
    }

    remove(db, target[ID]);

    res.status(200).json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export default {
  list,
  createAccessToken,
  updateState,
  removeAccessToken,
};
