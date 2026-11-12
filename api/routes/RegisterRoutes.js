import { Router } from 'express';
import { REGISTER } from '../ApiUrl.js';
import { register } from '../controllers/RegisterController.js';

const router = Router();

router.post(REGISTER, register);

export default router;
