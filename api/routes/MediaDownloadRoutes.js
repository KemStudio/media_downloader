import { Router } from 'express';
import { MEDIA_DOWNLOAD } from '../ApiUrl.js';
import { mediaDownload } from '../controllers/MediaDownloadController.js';
import { requireSessionOrBearer } from '../middleware/requireSessionOrBearer.js';

const router = Router();

router.get(MEDIA_DOWNLOAD, requireSessionOrBearer, mediaDownload);

export default router;
