import path from 'node:path';
import {
  DISK_FILE_NAME,
  ID,
  ORIGINAL_FILE_NAME,
  TABLE_NAME,
} from '../../model/DownloadFile.js';
import { findById } from './FindById.js';

function optionalText(value, fieldName) {
  if (value === null) {
    return null;
  }

  if (typeof value !== 'string') {
    throw new Error(`${fieldName} must be a string or null`);
  }

  const trimmed = value.trim();
  return trimmed || null;
}

function optionalDiskFileName(value) {
  const name = optionalText(value, DISK_FILE_NAME);
  if (name === null) {
    return null;
  }

  if (name !== path.basename(name)) {
    throw new Error('disk_file_name is invalid');
  }

  return name;
}

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

  if (fields[DISK_FILE_NAME] !== undefined) {
    updates.push(`${DISK_FILE_NAME} = ?`);
    values.push(optionalDiskFileName(fields[DISK_FILE_NAME]));
  }

  if (fields[ORIGINAL_FILE_NAME] !== undefined) {
    updates.push(`${ORIGINAL_FILE_NAME} = ?`);
    values.push(optionalText(fields[ORIGINAL_FILE_NAME], ORIGINAL_FILE_NAME));
  }

  if (updates.length === 0) {
    return existing;
  }

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
