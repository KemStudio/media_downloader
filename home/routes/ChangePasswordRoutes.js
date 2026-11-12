import { Router } from 'express';
import { index } from '../controllers/ChangePasswordController.js';
import { CHANGE_PASSWORD } from '../HomeUrl.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();

router.get(CHANGE_PASSWORD, requireAuth, index);

export default router;
