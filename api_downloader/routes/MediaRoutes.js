import { Router } from 'express';
import { requireApiAuth } from '../../api/middleware/requireApiAuth.js';
import { MEDIA } from '../DownloaderUrl.js';
import { list } from '../controllers/MediaController.js';

const router = Router();

router.get(MEDIA, requireApiAuth, list);

export default router;
