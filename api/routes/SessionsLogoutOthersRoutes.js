import { Router } from 'express';
import { SESSIONS_LOGOUT_OTHERS } from '../ApiUrl.js';
import { logoutOthers } from '../controllers/SessionsLogoutOthersController.js';
import { requireApiAuth } from '../middleware/requireApiAuth.js';

const router = Router();

router.post(SESSIONS_LOGOUT_OTHERS, requireApiAuth, logoutOthers);

export default router;
