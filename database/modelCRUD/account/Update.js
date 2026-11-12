import {
  ID,
  PASSWORD_HASH,
  ROLE,
  STATE,
  TABLE_NAME,
  UPDATED_AT,
  USERNAME,
} from '../../model/Account.js';
import { assertRole } from './AssertRole.js';
import { assertState } from './AssertState.js';
import { findById } from './FindById.js';
import { hashPassword } from './Password.js';

export function update(db, id, fields = {}) {
  const existing = findById(db, id);
  if (!existing) {
    return null;
  }

  const updates = [];
  const values = [];

  if (fields[USERNAME] !== undefined) {
    updates.push(`${USERNAME} = ?`);
    values.push(fields[USERNAME]);
  }

  if (fields.password !== undefined) {
    if (!fields.password) {
      throw new Error('password cannot be empty');
    }
    updates.push(`${PASSWORD_HASH} = ?`);
    values.push(hashPassword(fields.password));
  }

  if (fields[ROLE] !== undefined) {
    assertRole(fields[ROLE]);
    updates.push(`${ROLE} = ?`);
    values.push(fields[ROLE]);
  }

  if (fields[STATE] !== undefined) {
    assertState(fields[STATE]);
    updates.push(`${STATE} = ?`);
    values.push(fields[STATE]);
  }

  if (updates.length === 0) {
    return existing;
  }

  updates.push(`${UPDATED_AT} = datetime('now')`);
  values.push(id);

  db.prepare(
    `UPDATE ${TABLE_NAME}
     SET ${updates.join(', ')}
     WHERE ${ID} = ?`
  ).run(...values);

  return findById(db, id);
}
