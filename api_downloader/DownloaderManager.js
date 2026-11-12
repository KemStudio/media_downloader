import mediaRoutes from './routes/MediaRoutes.js';
import tiktokRoutes from './sources/tiktok/index.js';

export function init(app) {
  app.use(tiktokRoutes);
  app.use(mediaRoutes);
}

export default {
  init,
};
