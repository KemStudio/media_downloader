import {
  DISK_FILE_NAME,
  ERROR_MESSAGE,
  FINISHED_AT,
  ID,
  ORIGINAL_FILE_NAME,
  STARTED_AT,
  STATUS,
  STATUSES,
  TABLE_NAME,
  UPDATED_AT,
} from '../../model/DownloadMedia.js';
import { findById } from './FindById.js';

const VALID_STATUSES = new Set(Object.values(STATUSES));

export function update(db, id, fields = {}) {
  if (!Number.isInteger(id) || id < 1) {
    throw new Error('id must be a positive integer');
  }

  const existing = findById(db, id);
  if (!existing) {
    return null;
  }

  const updates = [];
  const values = [];

  if (fields[STATUS] !== undefined) {
    if (!VALID_STATUSES.has(fields[STATUS])) {
      throw new Error('status is invalid');
    }
    updates.push(`${STATUS} = ?`);
    values.push(fields[STATUS]);
  }

  if (fields[ORIGINAL_FILE_NAME] !== undefined) {
    const value = fields[ORIGINAL_FILE_NAME];
    if (value !== null && (typeof value !== 'string' || !value.trim())) {
      throw new Error('original_file_name must be a non-empty string or null');
    }
    updates.push(`${ORIGINAL_FILE_NAME} = ?`);
    values.push(value == null ? null : value.trim());
  }

  if (fields[DISK_FILE_NAME] !== undefined) {
    const value = fields[DISK_FILE_NAME];
    if (value !== null && (typeof value !== 'string' || !value.trim())) {
      throw new Error('disk_file_name must be a non-empty string or null');
    }
    updates.push(`${DISK_FILE_NAME} = ?`);
    values.push(value == null ? null : value.trim());
  }

  if (fields[ERROR_MESSAGE] !== undefined) {
    const value = fields[ERROR_MESSAGE];
    if (value !== null && typeof value !== 'string') {
      throw new Error('error_message must be a string or null');
    }
    updates.push(`${ERROR_MESSAGE} = ?`);
    values.push(value == null ? null : value);
  }

  if (fields[STARTED_AT] !== undefined) {
    const value = fields[STARTED_AT];
    if (value !== null && typeof value !== 'string') {
      throw new Error('started_at must be a string or null');
    }
    updates.push(`${STARTED_AT} = ?`);
    values.push(value);
  }

  if (fields[FINISHED_AT] !== undefined) {
    const value = fields[FINISHED_AT];
    if (value !== null && typeof value !== 'string') {
      throw new Error('finished_at must be a string or null');
    }
    updates.push(`${FINISHED_AT} = ?`);
    values.push(value);
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

export default {
  update,
};
