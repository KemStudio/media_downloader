import { Router } from 'express';
import { ACCOUNT_PASSWORD } from '../ApiUrl.js';
import { changePassword } from '../controllers/ChangePasswordController.js';
import { requireApiAuth } from '../middleware/requireApiAuth.js';

const router = Router();

router.post(ACCOUNT_PASSWORD, requireApiAuth, changePassword);

export default router;
