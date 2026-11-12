import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const LIST = '/api/cron-job';
export const LAST_RUN = '/api/cron-job/last_run';
export const ENABLED = '/api/cron-job/enabled';
export const CRON = '/api/cron-job/cron';
export const INTERVAL = '/api/cron-job/interval';

export const SQLITE_PATH = path.join(__dirname, 'data', 'cron_job.sqlite');

export default {
  LIST,
  LAST_RUN,
  ENABLED,
  CRON,
  INTERVAL,
  SQLITE_PATH,
};
