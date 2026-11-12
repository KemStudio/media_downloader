import { Router } from 'express';
import { MEDIA_LIST } from '../ApiUrl.js';
import { list } from '../controllers/MediaListController.js';
import { requireApiAuth } from '../middleware/requireApiAuth.js';

const router = Router();

router.get(MEDIA_LIST, requireApiAuth, list);

export default router;
