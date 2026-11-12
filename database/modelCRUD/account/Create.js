import {
  PASSWORD_HASH,
  ROLE,
  ROLES,
  STATE,
  STATES,
  TABLE_NAME,
  USERNAME,
} from '../../model/Account.js';
import { assertRole } from './AssertRole.js';
import { assertState } from './AssertState.js';
import { findById } from './FindById.js';
import { hashPassword } from './Password.js';
import { assertValidCredentials } from './ValidateCredentials.js';

export function create(db, {
  [USERNAME]: username,
  password,
  [ROLE]: role = ROLES.USER,
  [STATE]: state = STATES.ACTIVE,
}) {
  assertValidCredentials(username, password);
  assertRole(role);
  assertState(state);

  const passwordHash = hashPassword(password);
  const result = db
    .prepare(
      `INSERT INTO ${TABLE_NAME} (${USERNAME}, ${PASSWORD_HASH}, ${ROLE}, ${STATE})
       VALUES (?, ?, ?, ?)`
    )
    .run(username, passwordHash, role, state);

  return findById(db, result.lastInsertRowid);
}
