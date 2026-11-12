import localJobRegistry from '../localJobRegistry.js';
import jobsModel from '../model/JobsModel.js';

function lastRunPayload(key, row) {
  return {
    key,
    last_run_at: row ? row.last_run_at : null,
    last_status: row ? row.last_status : null,
    last_error: row ? row.last_error : null,
    last_duration_ms: row ? row.last_duration_ms : null,
  };
}

export function getAction(req, res) {
  try {
    const key = typeof req.query.key === 'string' ? req.query.key.trim() : '';
    const registry = localJobRegistry.jobs || {};

    if (key) {
      if (!registry[key]) {
        res.status(404).json({ error: 'Job not found.' });
        return;
      }
      const row = jobsModel.findByKey(key);
      res.status(200).json(lastRunPayload(key, row));
      return;
    }

    const jobs = Object.keys(registry)
      .sort()
      .map((jobKey) => lastRunPayload(jobKey, jobsModel.findByKey(jobKey)));
    res.status(200).json({ jobs });
  } catch (error) {
    console.error(`LastRunController.getAction: ${error}`);
    res.status(500).json({ error: 'Something went wrong. Please try again later.' });
  }
}

export default {
  getAction,
};
