import { Router } from 'express';
import { enqueue } from '../controllers/TikTokUserVideoController.js';
import { TIKTOK_USER_VIDEO } from '../DownloaderUrl.js';
import { requireBearerAccessToken } from '../middleware/requireBearerAccessToken.js';

const router = Router();

router.post(TIKTOK_USER_VIDEO, requireBearerAccessToken, enqueue);

export default router;
