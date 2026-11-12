import { Router } from 'express';
import { MEDIA_LIST, MEDIA_LIST_FILES } from '../ApiUrl.js';
import { list, listFiles } from '../controllers/MediaListController.js';
import { requireSessionOrBearer } from '../middleware/requireSessionOrBearer.js';

const router = Router();

router.get(MEDIA_LIST_FILES, requireSessionOrBearer, listFiles);
router.get(MEDIA_LIST, requireSessionOrBearer, list);

export default router;
