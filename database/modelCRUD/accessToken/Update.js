import {
  ID,
  NAME,
  STATE,
  TABLE_NAME,
  UPDATED_AT,
} from '../../model/AccessToken.js';
import { assertState } from './AssertState.js';
import { findById } from './FindById.js';

export function update(db, id, fields = {}) {
  const existing = findById(db, id);
  if (!existing) {
    return null;
  }

  const updates = [];
  const values = [];

  if (fields[NAME] !== undefined) {
    if (typeof fields[NAME] !== 'string' || !fields[NAME].trim()) {
      throw new Error('name cannot be empty');
    }
    updates.push(`${NAME} = ?`);
    values.push(fields[NAME].trim());
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
     WHERE ${ID} = ?`,
  ).run(...values);

  return findById(db, id);
}
