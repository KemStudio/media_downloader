import localCronScheduler from '../LocalCronScheduler.js';
import localJobRegistry from '../localJobRegistry.js';
import jobsModel from '../model/JobsModel.js';
import localSetting from '../Setting.js';

function isIntervalJob(def) {
  return def && Number.isInteger(def.default_interval_ms) && def.default_interval_ms > 0;
}

export function postAction(req, res) {
  try {
    const key = typeof req.body?.key === 'string' ? req.body.key.trim() : '';
    const interval_ms = req.body?.interval_ms;
    const def = key ? localJobRegistry.jobs[key] : null;

    if (!key || !def) {
      res.status(400).json({ error: 'The job key is invalid.' });
      return;
    }

    if (
      !isIntervalJob(def) ||
      !Number.isInteger(interval_ms) ||
      interval_ms < localSetting.INTERVAL_MIN_MS
    ) {
      res.status(400).json({ error: 'The interval is invalid.' });
      return;
    }

    const row = jobsModel.setIntervalMs(key, interval_ms);
    if (!row) {
      res.status(404).json({ error: 'Job not found.' });
      return;
    }

    localCronScheduler.refreshInterval(key);
    res.status(200).json({
      key: row.key,
      interval_ms: row.interval_ms,
    });
  } catch (error) {
    console.error(`IntervalController.postAction: ${error}`);
    res.status(500).json({ error: 'Something went wrong. Please try again later.' });
  }
}

export default {
  postAction,
};
