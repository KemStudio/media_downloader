import { Router } from 'express';
import { index } from '../controllers/DownloadsController.js';
import { DOWNLOADS } from '../HomeUrl.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();

router.get(DOWNLOADS, requireAuth, index);

export default router;
