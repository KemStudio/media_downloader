import {
  IS_ACTIVE,
  PASSWORD_HASH,
  ROLE,
  ROLES,
  TABLE_NAME,
  USERNAME,
} from '../../model/Account.js';
import { assertRole } from './AssertRole.js';
import { findById } from './FindById.js';
import { hashPassword } from './Password.js';

export function create(db, {
  [USERNAME]: username,
  password,
  [ROLE]: role = ROLES.USER,
  [IS_ACTIVE]: isActive = true,
}) {
  if (!username || !password) {
    throw new Error(`${USERNAME} and password are required`);
  }

  assertRole(role);

  const passwordHash = hashPassword(password);
  const result = db
    .prepare(
      `INSERT INTO ${TABLE_NAME} (${USERNAME}, ${PASSWORD_HASH}, ${ROLE}, ${IS_ACTIVE})
       VALUES (?, ?, ?, ?)`
    )
    .run(username, passwordHash, role, isActive ? 1 : 0);

  return findById(db, result.lastInsertRowid);
}
