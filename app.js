import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import ApiManager from './api/ApiManager.js';
import CronManager from './api_cron_job/CronManager.js';
import DownloaderManager from './api_downloader/DownloaderManager.js';
import DataManager from './database/DataManager.js';
import HomeManager from './home/HomeManager.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const PORT = Number(process.env.PORT) || 3000;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 200;

DataManager.init();

const app = express();

app.use(helmet());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'home', 'public')));

app.set('views', path.join(__dirname, 'home', 'views'));
app.set('view engine', 'ejs');

// Rate-limit API only — static assets and HTML pages must not share this budget,
// or later scripts (e.g. logout.js on non-home pages) get 429 and never run.
app.use(
  rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    max: RATE_LIMIT_MAX,
  }),
);

ApiManager.init(app);
DownloaderManager.init(app);
CronManager.dbInit();
CronManager.appRoute(app);
CronManager.startScheduler();
HomeManager.init(app);

app.listen(PORT, () => {
  console.log(`-> Media Downloader server is listening at http://127.0.0.1:${PORT}`);
});
