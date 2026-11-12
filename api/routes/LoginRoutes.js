import { Router } from 'express';
import { LOGIN } from '../ApiUrl.js';
import { login } from '../controllers/LoginController.js';

const router = Router();

router.post(LOGIN, login);

export default router;
