import tikTokUserPhotoRoutes from './routes/TikTokUserPhotoRoutes.js';
import tikTokUserVideoRoutes from './routes/TikTokUserVideoRoutes.js';

export function init(app) {
  app.use(tikTokUserVideoRoutes);
  app.use(tikTokUserPhotoRoutes);
}

export default {
  init,
};
