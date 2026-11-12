import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { createTableSQL, IS_ACTIVE, ROLE, ROLES, USERNAME } from './model/Account.js';
import { create } from './modelCRUD/account/Create.js';
import { findByUsername } from './modelCRUD/account/FindByUsername.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'media_downloader.db');

let db = null;

function ensureDataDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function createTables(database) {
  database.exec(createTableSQL);
}

function seedRootIfMissing(database) {
  const username = process.env.ROOT_USER_NAME;
  const password = process.env.ROOT_PASSWORD;

  if (!username || !password) {
    throw new Error('ROOT_USER_NAME and ROOT_PASSWORD must be set in environment');
  }

  const existing = findByUsername(database, username);
  if (existing) {
    return existing;
  }

  return create(database, {
    [USERNAME]: username,
    password,
    [ROLE]: ROLES.ROOT,
    [IS_ACTIVE]: true,
  });
}

export function init() {
  if (db) {
    return db;
  }

  ensureDataDir();

  db = new DatabaseSync(DB_PATH);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');

  createTables(db);
  seedRootIfMissing(db);

  return db;
}

export function getDb() {
  if (!db) {
    throw new Error('Database has not been initialized. Call init() first.');
  }

  return db;
}

export function close() {
  if (!db) {
    return;
  }

  db.close();
  db = null;
}

export default {
  init,
  getDb,
  close,
};
