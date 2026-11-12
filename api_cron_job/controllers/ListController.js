import localJobRegistry from '../localJobRegistry.js';
import jobsModel from '../model/JobsModel.js';

export function getAction(req, res) {
  try {
    const jobs = [];
    const registry = localJobRegistry.jobs || {};

    for (const def of Object.values(registry)) {
      if (!def || typeof def.key !== 'string') {
        continue;
      }

      const row = jobsModel.findByKey(def.key);
      const isInterval =
        Number.isInteger(def.default_interval_ms) && def.default_interval_ms > 0;
      let intervalMs = null;
      if (isInterval) {
        intervalMs =
          row && Number.isInteger(row.interval_ms) && row.interval_ms > 0
            ? row.interval_ms
            : def.default_interval_ms;
      }

      jobs.push({
        key: def.key,
        title: typeof def.title === 'string' ? def.title : def.key,
        description: typeof def.description === 'string' ? def.description : '',
        enabled: row ? row.enabled : false,
        cron_expression: row
          ? row.cron_expression
          : typeof def.default_cron === 'string'
            ? def.default_cron
            : '',
        schedule_mode: isInterval ? 'interval' : 'cron',
        interval_ms: intervalMs,
      });
    }

    jobs.sort((a, b) => a.key.localeCompare(b.key));
    res.status(200).json({ jobs });
  } catch (error) {
    console.error(`ListController.getAction: ${error}`);
    res.status(500).json({ error: 'Something went wrong. Please try again later.' });
  }
}

export default {
  getAction,
};
