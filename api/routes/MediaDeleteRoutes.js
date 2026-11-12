import { Router } from 'express';
import { MEDIA_DELETE } from '../ApiUrl.js';
import { mediaDelete } from '../controllers/MediaDeleteController.js';
import { requireSessionOrBearer } from '../middleware/requireSessionOrBearer.js';

const router = Router();

router.delete(MEDIA_DELETE, requireSessionOrBearer, mediaDelete);

export default router;
