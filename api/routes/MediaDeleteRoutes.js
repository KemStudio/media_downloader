import { Router } from 'express';
import { MEDIA_DELETE } from '../ApiUrl.js';
import { mediaDelete } from '../controllers/MediaDeleteController.js';
import { requireApiAuth } from '../middleware/requireApiAuth.js';

const router = Router();

router.delete(MEDIA_DELETE, requireApiAuth, mediaDelete);

export default router;
