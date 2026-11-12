import tiktokRoutes from './sources/tiktok/index.js';

export function init(app) {
  app.use(tiktokRoutes);
}

export default {
  init,
};
