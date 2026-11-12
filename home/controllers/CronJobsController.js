import {
  CRON,
  ENABLED,
  INTERVAL,
  LAST_RUN,
  LIST,
} from '../../api_cron_job/CronUrl.js';
import { INTERVAL_MIN_MS } from '../../api_cron_job/Setting.js';

const PAGE_TITLE = 'Cron jobs';
const VIEW_CRON_JOBS = 'CronJobsView';

export function index(req, res) {
  res.render(VIEW_CRON_JOBS, {
    title: PAGE_TITLE,
    cronListEndpoint: LIST,
    cronLastRunEndpoint: LAST_RUN,
    cronEnabledEndpoint: ENABLED,
    cronIntervalEndpoint: INTERVAL,
    cronCronEndpoint: CRON,
    cronIntervalMinSeconds: Math.max(1, Math.floor(INTERVAL_MIN_MS / 1000)),
    account: res.locals.account,
  });
}

export default {
  index,
};
