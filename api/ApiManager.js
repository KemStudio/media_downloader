import session from 'express-session';
import { getDb } from '../database/DataManager.js';
import { SqliteSessionStore } from '../database/SqliteSessionStore.js';
import {
  SESSION_COOKIE_HTTP_ONLY,
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_SAME_SITE,
  SESSION_COOKIE_SECURE,
  SESSION_MAX_AGE_MS,
} from './Setting.js';
import loginRoutes from './routes/LoginRoutes.js';
import logoutRoutes from './routes/LogoutRoutes.js';
import registerRoutes from './routes/RegisterRoutes.js';
import sessionsRoutes from './routes/SessionsRoutes.js';
import sessionsLogoutOthersRoutes from './routes/SessionsLogoutOthersRoutes.js';
import sessionsLogoutRoutes from './routes/SessionsLogoutRoutes.js';

export function init(app) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('SESSION_SECRET must be set in environment');
  }

  app.use(
    session({
      name: SESSION_COOKIE_NAME,
      secret,
      resave: false,
      saveUninitialized: false,
      store: new SqliteSessionStore(getDb(), { ttlMs: SESSION_MAX_AGE_MS }),
      cookie: {
        maxAge: SESSION_MAX_AGE_MS,
        httpOnly: SESSION_COOKIE_HTTP_ONLY,
        sameSite: SESSION_COOKIE_SAME_SITE,
        secure: SESSION_COOKIE_SECURE,
      },
    }),
  );

  app.use(registerRoutes);
  app.use(loginRoutes);
  app.use(logoutRoutes);
  app.use(sessionsRoutes);
  app.use(sessionsLogoutOthersRoutes);
  app.use(sessionsLogoutRoutes);
}

export default {
  init,
};
