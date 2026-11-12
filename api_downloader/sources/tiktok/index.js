import { Router } from 'express';
import tiktokComRoutes from './tiktok.com/routes.js';

const router = Router();

router.use(tiktokComRoutes);

export default router;
