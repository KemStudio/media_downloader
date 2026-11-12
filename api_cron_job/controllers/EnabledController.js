import localCronScheduler from '../LocalCronScheduler.js';
import localJobRegistry from '../localJobRegistry.js';
import jobsModel from '../model/JobsModel.js';

export function postAction(req, res) {
  try {
    const key = typeof req.body?.key === 'string' ? req.body.key.trim() : '';
    const enabled = req.body?.enabled;

    if (!key || !localJobRegistry.jobs[key]) {
      res.status(400).json({ error: 'The job key is invalid.' });
      return;
    }

    if (typeof enabled !== 'boolean') {
      res.status(400).json({ error: 'enabled must be a boolean.' });
      return;
    }

    const row = jobsModel.setEnabled(key, enabled);
    if (!row) {
      res.status(404).json({ error: 'Job not found.' });
      return;
    }

    localCronScheduler.reschedule(key);
    res.status(200).json({ key: row.key, enabled: row.enabled });
  } catch (error) {
    console.error(`EnabledController.postAction: ${error}`);
    res.status(500).json({ error: 'Something went wrong. Please try again later.' });
  }
}

export default {
  postAction,
};
