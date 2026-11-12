import tikTokUserVideoRoutes from './routes/TikTokUserVideoRoutes.js';

export function init(app) {
  app.use(tikTokUserVideoRoutes);
}

export default {
  init,
};
