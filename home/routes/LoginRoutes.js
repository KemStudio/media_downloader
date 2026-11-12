import { Router } from 'express';
import { index } from '../controllers/LoginController.js';
import { LOGIN } from '../HomeUrl.js';
import { requireGuest } from '../middleware/requireGuest.js';

const router = Router();

router.get(LOGIN, requireGuest, index);

export default router;
