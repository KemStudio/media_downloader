import { Router } from 'express';
import { index } from '../controllers/SessionsController.js';
import { SESSIONS } from '../HomeUrl.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();

router.get(SESSIONS, requireAuth, index);

export default router;
