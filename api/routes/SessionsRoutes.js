import { Router } from 'express';
import { SESSIONS } from '../ApiUrl.js';
import { list } from '../controllers/SessionsController.js';
import { requireApiAuth } from '../middleware/requireApiAuth.js';

const router = Router();

router.get(SESSIONS, requireApiAuth, list);

export default router;
