import { Router } from 'express';
import { ROLES } from '../../database/model/Account.js';
import { index } from '../controllers/CronJobsController.js';
import { CRON_JOBS } from '../HomeUrl.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireRoles } from '../middleware/requireRoles.js';

const router = Router();

router.get(CRON_JOBS, requireAuth, requireRoles(ROLES.ROOT, ROLES.ADMIN), index);

export default router;
