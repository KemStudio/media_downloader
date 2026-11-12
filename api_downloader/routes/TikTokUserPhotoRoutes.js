import { Router } from 'express';
import { enqueue } from '../controllers/TikTokUserPhotoController.js';
import { TIKTOK_USER_PHOTO } from '../DownloaderUrl.js';
import { requireBearerAccessToken } from '../middleware/requireBearerAccessToken.js';

const router = Router();

router.post(TIKTOK_USER_PHOTO, requireBearerAccessToken, enqueue);

export default router;
