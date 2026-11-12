import { Router } from 'express';
import { LOGOUT } from '../ApiUrl.js';
import { logout } from '../controllers/LogoutController.js';

const router = Router();

router.post(LOGOUT, logout);

export default router;
