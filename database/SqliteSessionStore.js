import session from 'express-session';
import { DATA, EXPIRES_AT, ID, TABLE_NAME } from './model/Session.js';
import { findById } from './modelCRUD/session/FindById.js';
import { purgeExpired } from './modelCRUD/session/PurgeExpired.js';
import { remove } from './modelCRUD/session/Remove.js';
import { touch } from './modelCRUD/session/Touch.js';
import { upsert } from './modelCRUD/session/Upsert.js';

const Store = session.Store;

function toExpiresAt(sessionData, maxAgeMs) {
  if (sessionData?.cookie?.expires) {
    return new Date(sessionData.cookie.expires).toISOString();
  }

  const ttlMs = Number.isFinite(maxAgeMs) && maxAgeMs > 0 ? maxAgeMs : 24 * 60 * 60 * 1000;
  return new Date(Date.now() + ttlMs).toISOString();
}

function isExpired(expiresAt) {
  return new Date(expiresAt).getTime() <= Date.now();
}

export class SqliteSessionStore extends Store {
  constructor(db, options = {}) {
    super(options);
    this.db = db;
    this.ttlMs = options.ttlMs;
  }

  get(sid, callback) {
    try {
      const row = findById(this.db, sid);
      if (!row) {
        callback(null, null);
        return;
      }

      if (isExpired(row[EXPIRES_AT])) {
        remove(this.db, sid);
        callback(null, null);
        return;
      }

      callback(null, JSON.parse(row[DATA]));
    } catch (error) {
      callback(error);
    }
  }

  set(sid, sessionData, callback) {
    try {
      const expiresAt = toExpiresAt(sessionData, this.ttlMs);
      upsert(this.db, {
        [ID]: sid,
        [DATA]: JSON.stringify(sessionData),
        [EXPIRES_AT]: expiresAt,
      });
      callback(null);
    } catch (error) {
      callback(error);
    }
  }

  destroy(sid, callback) {
    try {
      remove(this.db, sid);
      callback(null);
    } catch (error) {
      callback(error);
    }
  }

  touch(sid, sessionData, callback) {
    try {
      const expiresAt = toExpiresAt(sessionData, this.ttlMs);
      touch(this.db, sid, expiresAt);
      callback(null);
    } catch (error) {
      callback(error);
    }
  }

  clear(callback) {
    try {
      this.db.exec(`DELETE FROM ${TABLE_NAME}`);
      callback(null);
    } catch (error) {
      callback(error);
    }
  }

  length(callback) {
    try {
      purgeExpired(this.db);
      const row = this.db.prepare(`SELECT COUNT(*) AS count FROM ${TABLE_NAME}`).get();
      callback(null, row.count);
    } catch (error) {
      callback(error);
    }
  }
}

export default SqliteSessionStore;
