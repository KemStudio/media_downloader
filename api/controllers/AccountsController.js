import { getDb } from '../../database/DataManager.js';
import {
  ID,
  ROLE,
  ROLES,
  STATE,
  STATES,
} from '../../database/model/Account.js';
import { assertStateTransition } from '../../database/modelCRUD/account/AssertState.js';
import { findById } from '../../database/modelCRUD/account/FindById.js';
import { findPage } from '../../database/modelCRUD/account/FindPage.js';
import { remove } from '../../database/modelCRUD/account/Remove.js';
import { update } from '../../database/modelCRUD/account/Update.js';
import { removeByAccountId } from '../../database/modelCRUD/session/RemoveByAccountId.js';
import {
  ACCOUNTS_PAGE_LIMIT,
  parseAccountId,
  parseStatesQuery,
  toPublicAccount,
} from '../utils/account.js';
import { parseStartIndex } from '../utils/session.js';

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

  try {
    const { accounts } = findPage(getDb(), {
      states,
      limit: ACCOUNTS_PAGE_LIMIT,
      offset: startIndex,
    });

    res.status(200).json({
      accounts: accounts.map(toPublicAccount),
      start_index: startIndex,
      limit: ACCOUNTS_PAGE_LIMIT,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export function updateState(req, res) {
  const accountId = parseAccountId(req.params.id);
  const nextState = req.body?.state;

  if (accountId === null) {
    res.status(400).json({ error: 'id must be a positive integer' });
    return;
  }

  if (typeof nextState !== 'string' || !nextState.trim()) {
    res.status(400).json({ error: 'state is required' });
    return;
  }

  try {
    const db = getDb();
    const target = findById(db, accountId);

    if (!target) {
      res.status(404).json({ error: 'account not found' });
      return;
    }

    if (target[STATE] === STATES.HIDE) {
      res.status(400).json({ error: 'cannot change state of a hidden account' });
      return;
    }

    if (
      req.account[ROLE] === ROLES.ADMIN
      && target[ROLE] === ROLES.ROOT
    ) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    if (
      (nextState === STATES.DEACTIVE || nextState === STATES.HIDE)
      && target[ROLE] !== ROLES.USER
    ) {
      res.status(400).json({ error: 'only user accounts can be deactivated or hidden' });
      return;
    }

    assertStateTransition(target[STATE], nextState);

    const updated = update(db, target[ID], { [STATE]: nextState });

    if (nextState === STATES.HIDE) {
      removeByAccountId(db, target[ID]);
    }

    res.status(200).json({ account: toPublicAccount(updated) });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

export function updateRole(req, res) {
  const accountId = parseAccountId(req.params.id);
  const nextRole = req.body?.role;

  if (accountId === null) {
    res.status(400).json({ error: 'id must be a positive integer' });
    return;
  }

  if (typeof nextRole !== 'string' || !nextRole.trim()) {
    res.status(400).json({ error: 'role is required' });
    return;
  }

  if (nextRole !== ROLES.ADMIN && nextRole !== ROLES.USER) {
    res.status(400).json({ error: 'role must be admin or user' });
    return;
  }

  try {
    const db = getDb();
    const target = findById(db, accountId);

    if (!target) {
      res.status(404).json({ error: 'account not found' });
      return;
    }

    if (target[ROLE] === ROLES.ROOT) {
      res.status(400).json({ error: 'cannot change role of root account' });
      return;
    }

    if (target[ROLE] === nextRole) {
      res.status(400).json({ error: `role is already ${nextRole}` });
      return;
    }

    if (nextRole === ROLES.ADMIN) {
      if (target[STATE] !== STATES.ACTIVE || target[ROLE] !== ROLES.USER) {
        res.status(400).json({
          error: 'only active user accounts can be promoted to admin',
        });
        return;
      }
    }

    if (nextRole === ROLES.USER) {
      if (target[STATE] !== STATES.ACTIVE || target[ROLE] !== ROLES.ADMIN) {
        res.status(400).json({
          error: 'only active admin accounts can be demoted to user',
        });
        return;
      }
    }

    const updated = update(db, target[ID], { [ROLE]: nextRole });

    res.status(200).json({ account: toPublicAccount(updated) });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

export function removeAccount(req, res) {
  const accountId = parseAccountId(req.params.id);

  if (accountId === null) {
    res.status(400).json({ error: 'id must be a positive integer' });
    return;
  }

  try {
    const db = getDb();
    const target = findById(db, accountId);

    if (!target) {
      res.status(404).json({ error: 'account not found' });
      return;
    }

    if (target[STATE] !== STATES.HIDE) {
      res.status(400).json({ error: 'only hidden accounts can be deleted' });
      return;
    }

    removeByAccountId(db, target[ID]);
    remove(db, target[ID]);

    res.status(200).json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export default {
  list,
  updateState,
  updateRole,
  removeAccount,
};
