import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const LIST = '/api_cron_job/list';
export const LAST_RUN = '/api_cron_job/last_run';
export const ENABLED = '/api_cron_job/enabled';
export const CRON = '/api_cron_job/cron';
export const INTERVAL = '/api_cron_job/interval';

export const SQLITE_PATH = path.join(__dirname, 'data', 'cron_job.sqlite');

export default {
  LIST,
  LAST_RUN,
  ENABLED,
  CRON,
  INTERVAL,
  SQLITE_PATH,
};
