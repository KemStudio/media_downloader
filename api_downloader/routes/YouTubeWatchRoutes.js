import { Router } from 'express';
import { enqueue } from '../controllers/YouTubeWatchController.js';
import { YOUTUBE_WATCH } from '../DownloaderUrl.js';
import { requireBearerAccessToken } from '../middleware/requireBearerAccessToken.js';

const router = Router();

router.post(YOUTUBE_WATCH, requireBearerAccessToken, enqueue);

export default router;
