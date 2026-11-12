import { Router } from 'express';
import { MEDIA_THUMBNAIL } from '../ApiUrl.js';
import { mediaThumbnail } from '../controllers/MediaThumbnailController.js';
import { requireSessionOrBearer } from '../middleware/requireSessionOrBearer.js';

const router = Router();

router.get(MEDIA_THUMBNAIL, requireSessionOrBearer, mediaThumbnail);

export default router;
