import homeRoutes from './routes/HomeRoutes.js';

export function init(app) {
  app.use(homeRoutes);
}

export default {
  init,
};
