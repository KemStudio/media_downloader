import { Router } from 'express';
import { HOME } from '../HomeUrl.js';
import { index } from '../controllers/HomeController.js';

const router = Router();

router.get(HOME, index);

export default router;
