import { Router } from 'express';
import { SESSIONS_LOGOUT } from '../ApiUrl.js';
import { logoutSession } from '../controllers/SessionsLogoutController.js';
import { requireApiAuth } from '../middleware/requireApiAuth.js';

const router = Router();

router.post(SESSIONS_LOGOUT, requireApiAuth, logoutSession);

export default router;
