import { Router } from 'express';
import { TIKTOK_TIKTOK_COM } from '../../../DownloaderUrl.js';
import { requireBearerAccessToken } from '../../../middleware/requireBearerAccessToken.js';
import { enqueue } from './controller.js';

const router = Router();

router.post(TIKTOK_TIKTOK_COM, requireBearerAccessToken, enqueue);

export default router;
