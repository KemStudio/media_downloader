import tikTokUserPhotoRoutes from './routes/TikTokUserPhotoRoutes.js';
import tikTokUserVideoRoutes from './routes/TikTokUserVideoRoutes.js';
import youTubePlaylistRoutes from './routes/YouTubePlaylistRoutes.js';
import youTubeShortsRoutes from './routes/YouTubeShortsRoutes.js';
import youTubeWatchRoutes from './routes/YouTubeWatchRoutes.js';

export function init(app) {
  app.use(tikTokUserVideoRoutes);
  app.use(tikTokUserPhotoRoutes);
  app.use(youTubeWatchRoutes);
  app.use(youTubeShortsRoutes);
  app.use(youTubePlaylistRoutes);
}

export default {
  init,
};
