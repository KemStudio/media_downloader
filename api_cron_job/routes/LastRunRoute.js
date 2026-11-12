import { Router } from 'express';
import { ROLES } from '../../database/model/Account.js';
import { requireApiAuth } from '../../api/middleware/requireApiAuth.js';
import { requireApiRoles } from '../../api/middleware/requireApiRoles.js';
import { getAction } from '../controllers/LastRunController.js';
import { LAST_RUN } from '../CronUrl.js';

const router = Router();

router.get(
  LAST_RUN,
  requireApiAuth,
  requireApiRoles(ROLES.ROOT, ROLES.ADMIN),
  getAction,
);

export default router;
