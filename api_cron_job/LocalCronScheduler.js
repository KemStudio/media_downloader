import cron from 'node-cron';
import localJobRegistry from './localJobRegistry.js';
import jobsModel from './model/JobsModel.js';
import localSetting from './Setting.js';

const cronTasks = new Map();
const intervalTimers = new Map();
const running = new Set();
const rerunAfter = new Set();

function timezone() {
  return process.env.CRON_TZ || localSetting.CRON_TIMEZONE;
}

function jobDef(key) {
  return localJobRegistry.jobs[key] || null;
}

function isIntervalJob(def) {
  return def && Number.isInteger(def.default_interval_ms) && def.default_interval_ms > 0;
}

function resolveIntervalMs(def, row) {
  if (row && Number.isInteger(row.interval_ms) && row.interval_ms > 0) {
    return row.interval_ms;
  }
  if (def && Number.isInteger(def.default_interval_ms) && def.default_interval_ms > 0) {
    return def.default_interval_ms;
  }
  return null;
}

function clearIntervalTimer(key) {
  const timer = intervalTimers.get(key);
  if (timer) {
    clearTimeout(timer);
    intervalTimers.delete(key);
  }
}

function stopCronTask(key) {
  const task = cronTasks.get(key);
  if (task) {
    task.stop();
    cronTasks.delete(key);
  }
}

function stopJobSchedule(key) {
  stopCronTask(key);
  clearIntervalTimer(key);
}

function armIntervalSleep(key) {
  clearIntervalTimer(key);

  const def = jobDef(key);
  if (!isIntervalJob(def)) {
    return;
  }

  const row = jobsModel.findByKey(key);
  if (!row || !row.enabled) {
    return;
  }

  const delay = resolveIntervalMs(def, row);
  if (!Number.isInteger(delay) || delay <= 0) {
    return;
  }

  const timer = setTimeout(() => {
    intervalTimers.delete(key);
    runJob(key).catch((error) => {
      console.error(`LocalCronScheduler.interval: key=${key} ${error}`);
    });
  }, delay);
  intervalTimers.set(key, timer);
}

async function runJob(key) {
  const def = jobDef(key);
  if (!def || typeof def.run !== 'function') {
    console.error(`LocalCronScheduler: no handler for key=${key}`);
    return;
  }

  const row = jobsModel.findByKey(key);
  if (!row || !row.enabled) {
    stopJobSchedule(key);
    rerunAfter.delete(key);
    return;
  }

  if (running.has(key)) {
    jobsModel.setLastRun(key, 'skipped', 'Job is already running.', 0);
    return;
  }

  running.add(key);
  const started = Date.now();
  try {
    await def.run();
    jobsModel.setLastRun(key, 'success', null, Date.now() - started);
  } catch (error) {
    console.error(`LocalCronScheduler.runJob: key=${key} ${error}`);
    jobsModel.setLastRun(
      key,
      'error',
      error && error.message ? error.message : String(error),
      Date.now() - started,
    );
  } finally {
    running.delete(key);

    if (rerunAfter.has(key)) {
      rerunAfter.delete(key);
      if (jobsModel.findByKey(key)?.enabled) {
        await runJob(key);
        return;
      }
    }

    if (isIntervalJob(def)) {
      armIntervalSleep(key);
    }
  }
}

export function refreshInterval(key) {
  const def = jobDef(key);
  if (!isIntervalJob(def)) {
    return;
  }

  const row = jobsModel.findByKey(key);
  if (!row || !row.enabled) {
    return;
  }

  if (running.has(key)) {
    return;
  }

  armIntervalSleep(key);
}

export function reschedule(key) {
  stopJobSchedule(key);
  rerunAfter.delete(key);

  const def = jobDef(key);
  if (!def) {
    return;
  }

  const row = jobsModel.findByKey(key);
  if (!row || !row.enabled) {
    return;
  }

  if (isIntervalJob(def)) {
    runJob(key).catch((error) => {
      console.error(`LocalCronScheduler.reschedule: key=${key} ${error}`);
    });
    return;
  }

  if (!cron.validate(row.cron_expression)) {
    console.error(
      `LocalCronScheduler.reschedule: invalid cron for key=${key} expr=${row.cron_expression}`,
    );
    return;
  }

  const task = cron.schedule(
    row.cron_expression,
    () => {
      runJob(key).catch((error) => {
        console.error(`LocalCronScheduler.schedule: key=${key} ${error}`);
      });
    },
    { timezone: timezone() },
  );
  cronTasks.set(key, task);
}

export function kick(key) {
  const def = jobDef(key);
  if (!def) {
    return;
  }

  const row = jobsModel.findByKey(key);
  if (!row || !row.enabled) {
    return;
  }

  if (running.has(key)) {
    rerunAfter.add(key);
    return;
  }

  clearIntervalTimer(key);
  runJob(key).catch((error) => {
    console.error(`LocalCronScheduler.kick: key=${key} ${error}`);
  });
}

export function start() {
  for (const key of [...cronTasks.keys(), ...intervalTimers.keys()]) {
    stopJobSchedule(key);
  }
  rerunAfter.clear();

  const enabled = jobsModel.listEnabled();
  for (const row of enabled) {
    if (!localJobRegistry.jobs[row.key]) {
      continue;
    }
    reschedule(row.key);
  }
}

export function stopAll() {
  for (const key of [...cronTasks.keys(), ...intervalTimers.keys()]) {
    stopJobSchedule(key);
  }
  rerunAfter.clear();
}

export default {
  refreshInterval,
  reschedule,
  kick,
  start,
  stopAll,
};
