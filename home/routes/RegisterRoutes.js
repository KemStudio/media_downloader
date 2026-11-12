import { Router } from 'express';
import { index } from '../controllers/RegisterController.js';
import { REGISTER } from '../HomeUrl.js';
import { requireGuest } from '../middleware/requireGuest.js';

const router = Router();

router.get(REGISTER, requireGuest, index);

export default router;
