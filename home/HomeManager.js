import { loadAccount } from './middleware/loadAccount.js';
import homeRoutes from './routes/HomeRoutes.js';
import loginRoutes from './routes/LoginRoutes.js';
import registerRoutes from './routes/RegisterRoutes.js';

export function init(app) {
  app.use(loadAccount);
  app.use(loginRoutes);
  app.use(registerRoutes);
  app.use(homeRoutes);
}

export default {
  init,
};
