import localJobRegistry from '../localJobRegistry.js';
import localSetting from '../Setting.js';
import sqliteDb from './SqliteDb.js';

function nowIso() {
  return new Date().toISOString();
}

function defaultIntervalMs(job) {
  return Number.isInteger(job.default_interval_ms) && job.default_interval_ms > 0
    ? job.default_interval_ms
    : null;
}

function rowToJob(row) {
  if (!row) {
    return null;
  }

  return {
    key: row.key,
    enabled: Boolean(row.enabled),
    cron_expression: row.cron_expression,
    interval_ms: row.interval_ms == null ? null : Number(row.interval_ms),
    last_run_at: row.last_run_at,
    last_status: row.last_status,
    last_error: row.last_error,
    last_duration_ms: row.last_duration_ms == null ? null : Number(row.last_duration_ms),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function syncRegistry() {
  const db = sqliteDb.get();
  const insert = db.prepare(`
    INSERT OR IGNORE INTO jobs (
      key, enabled, cron_expression, interval_ms,
      last_run_at, last_status, last_error, last_duration_ms,
      created_at, updated_at
    ) VALUES (
      @key, @enabled, @cron_expression, @interval_ms,
      NULL, NULL, NULL, NULL,
      @created_at, @updated_at
    )
  `);

  const stamp = nowIso();
  const jobs = localJobRegistry.jobs || {};
  sqliteDb.transaction(() => {
    for (const job of Object.values(jobs)) {
      if (!job || typeof job.key !== 'string' || !job.key) {
        continue;
      }
      const intervalMs = defaultIntervalMs(job);
      insert.run({
        key: job.key,
        enabled: job.default_enabled ? 1 : 0,
        cron_expression:
          typeof job.default_cron === 'string'
            ? job.default_cron
            : localSetting.JOBS_FALLBACK_CRON,
        interval_ms: intervalMs,
        created_at: stamp,
        updated_at: stamp,
      });
    }
  });
}

export function findByKey(key) {
  const row = sqliteDb.get().prepare('SELECT * FROM jobs WHERE key = ?').get(key);
  return rowToJob(row);
}

export function listAll() {
  const rows = sqliteDb.get().prepare('SELECT * FROM jobs ORDER BY key ASC').all();
  return rows.map(rowToJob);
}

export function listEnabled() {
  const rows = sqliteDb
    .get()
    .prepare('SELECT * FROM jobs WHERE enabled = 1 ORDER BY key ASC')
    .all();
  return rows.map(rowToJob);
}

export function setEnabled(key, enabled) {
  const stamp = nowIso();
  const result = sqliteDb
    .get()
    .prepare(`
      UPDATE jobs
      SET enabled = @enabled, updated_at = @updated_at
      WHERE key = @key
    `)
    .run({
      key,
      enabled: enabled ? 1 : 0,
      updated_at: stamp,
    });
  if (!result.changes) {
    return null;
  }
  return findByKey(key);
}

export function setIntervalMs(key, interval_ms) {
  const stamp = nowIso();
  const result = sqliteDb
    .get()
    .prepare(`
      UPDATE jobs
      SET interval_ms = @interval_ms, updated_at = @updated_at
      WHERE key = @key
    `)
    .run({
      key,
      interval_ms,
      updated_at: stamp,
    });
  if (!result.changes) {
    return null;
  }
  return findByKey(key);
}

export function setCron(key, cron_expression) {
  const stamp = nowIso();
  const result = sqliteDb
    .get()
    .prepare(`
      UPDATE jobs
      SET cron_expression = @cron_expression, updated_at = @updated_at
      WHERE key = @key
    `)
    .run({
      key,
      cron_expression,
      updated_at: stamp,
    });
  if (!result.changes) {
    return null;
  }
  return findByKey(key);
}

export function setLastRun(key, status, errorMessage, durationMs) {
  const stamp = nowIso();
  const result = sqliteDb
    .get()
    .prepare(`
      UPDATE jobs
      SET last_run_at = @last_run_at,
          last_status = @last_status,
          last_error = @last_error,
          last_duration_ms = @last_duration_ms,
          updated_at = @updated_at
      WHERE key = @key
    `)
    .run({
      key,
      last_run_at: stamp,
      last_status: status,
      last_error: errorMessage == null ? null : String(errorMessage),
      last_duration_ms: durationMs == null ? null : Number(durationMs),
      updated_at: stamp,
    });
  if (!result.changes) {
    return null;
  }
  return findByKey(key);
}

export default {
  syncRegistry,
  findByKey,
  listAll,
  listEnabled,
  setEnabled,
  setIntervalMs,
  setCron,
  setLastRun,
};
