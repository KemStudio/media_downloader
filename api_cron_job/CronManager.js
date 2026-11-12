import localCronScheduler from './LocalCronScheduler.js';
import jobsModel from './model/JobsModel.js';
import sqliteDb from './model/SqliteDb.js';
import cronRoute from './routes/CronRoute.js';
import enabledRoute from './routes/EnabledRoute.js';
import intervalRoute from './routes/IntervalRoute.js';
import lastRunRoute from './routes/LastRunRoute.js';
import listRoute from './routes/ListRoute.js';

export function appRoute(app) {
  app.use(listRoute);
  app.use(lastRunRoute);
  app.use(enabledRoute);
  app.use(cronRoute);
  app.use(intervalRoute);
}

export function dbInit() {
  sqliteDb.open();
  jobsModel.syncRegistry();
}

export function startScheduler() {
  localCronScheduler.start();
}

export default {
  appRoute,
  dbInit,
  startScheduler,
};
