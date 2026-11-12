import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import cronUrl from '../CronUrl.js';
import localSetting from '../Setting.js';

let db = null;

export function open() {
  if (db) {
    return db;
  }

  const sqlitePath = cronUrl.SQLITE_PATH;
  fs.mkdirSync(path.dirname(sqlitePath), { recursive: true });

  db = new DatabaseSync(sqlitePath);
  db.exec(
    `PRAGMA journal_mode = ${localSetting.SQLITE_JOURNAL_MODE}; PRAGMA busy_timeout = ${localSetting.SQLITE_BUSY_TIMEOUT_MS};`,
  );
  db.exec(`
    CREATE TABLE IF NOT EXISTS jobs (
      key TEXT PRIMARY KEY NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 0,
      cron_expression TEXT NOT NULL,
      interval_ms INTEGER NULL,
      last_run_at TEXT NULL,
      last_status TEXT NULL,
      last_error TEXT NULL,
      last_duration_ms INTEGER NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
  return db;
}

export function get() {
  if (!db) {
    throw new Error('SQLite is not open. Call SqliteDb.open() first.');
  }
  return db;
}

export function transaction(callback) {
  const database = get();
  database.exec('BEGIN');
  try {
    const result = callback();
    database.exec('COMMIT');
    return result;
  } catch (error) {
    try {
      database.exec('ROLLBACK');
    } catch (rollbackError) {
      console.error('SQLite rollback failed:', rollbackError);
    }
    throw error;
  }
}

export function close() {
  if (!db) {
    return;
  }
  db.close();
  db = null;
}

export default {
  open,
  get,
  transaction,
  close,
};
