import { appNavLocals } from './middleware/appNavLocals.js';
import { loadAccount } from './middleware/loadAccount.js';
import accountsRoutes from './routes/AccountsRoutes.js';
import changePasswordRoutes from './routes/ChangePasswordRoutes.js';
import homeRoutes from './routes/HomeRoutes.js';
import loginRoutes from './routes/LoginRoutes.js';
import registerRoutes from './routes/RegisterRoutes.js';
import sessionsRoutes from './routes/SessionsRoutes.js';

export function init(app) {
  app.use(loadAccount);
  app.use(appNavLocals);
  app.use(loginRoutes);
  app.use(registerRoutes);
  app.use(sessionsRoutes);
  app.use(accountsRoutes);
  app.use(changePasswordRoutes);
  app.use(homeRoutes);
}

export default {
  init,
};
