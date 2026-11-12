import { Router } from 'express';
import { enqueue } from '../controllers/YouTubeShortsController.js';
import { YOUTUBE_SHORTS } from '../DownloaderUrl.js';
import { requireBearerAccessToken } from '../middleware/requireBearerAccessToken.js';

const router = Router();

router.post(YOUTUBE_SHORTS, requireBearerAccessToken, enqueue);

export default router;
