import { Router } from 'express';
import { index } from '../controllers/AccessTokensController.js';
import { ACCESS_TOKENS } from '../HomeUrl.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();

router.get(ACCESS_TOKENS, requireAuth, index);

export default router;
