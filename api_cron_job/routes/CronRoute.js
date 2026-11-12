import { Router } from 'express';
import { ROLES } from '../../database/model/Account.js';
import { requireApiAuth } from '../../api/middleware/requireApiAuth.js';
import { requireApiRoles } from '../../api/middleware/requireApiRoles.js';
import { postAction } from '../controllers/CronController.js';
import { CRON } from '../CronUrl.js';

const router = Router();

router.post(CRON, requireApiAuth, requireApiRoles(ROLES.ROOT, ROLES.ADMIN), postAction);

export default router;
