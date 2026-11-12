import cron from 'node-cron';
import localCronScheduler from '../LocalCronScheduler.js';
import localJobRegistry from '../localJobRegistry.js';
import jobsModel from '../model/JobsModel.js';

export function postAction(req, res) {
  try {
    const key = typeof req.body?.key === 'string' ? req.body.key.trim() : '';
    const cron_expression =
      typeof req.body?.cron_expression === 'string'
        ? req.body.cron_expression.trim()
        : '';

    if (!key || !localJobRegistry.jobs[key]) {
      res.status(400).json({ error: 'The job key is invalid.' });
      return;
    }

    if (!cron_expression || !cron.validate(cron_expression)) {
      res.status(400).json({ error: 'The cron expression is invalid.' });
      return;
    }

    const row = jobsModel.setCron(key, cron_expression);
    if (!row) {
      res.status(404).json({ error: 'Job not found.' });
      return;
    }

    localCronScheduler.reschedule(key);
    res.status(200).json({
      key: row.key,
      cron_expression: row.cron_expression,
    });
  } catch (error) {
    console.error(`CronController.postAction: ${error}`);
    res.status(500).json({ error: 'Something went wrong. Please try again later.' });
  }
}

export default {
  postAction,
};
