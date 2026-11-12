import { Router } from 'express';
import { index } from '../controllers/HomeController.js';
import { HOME } from '../HomeUrl.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();

router.get(HOME, requireAuth, index);

export default router;
