import { Router } from 'express';
import { ROLES } from '../../database/model/Account.js';
import { requireApiAuth } from '../../api/middleware/requireApiAuth.js';
import { requireApiRoles } from '../../api/middleware/requireApiRoles.js';
import { postAction } from '../controllers/EnabledController.js';
import { ENABLED } from '../CronUrl.js';

const router = Router();

router.post(
  ENABLED,
  requireApiAuth,
  requireApiRoles(ROLES.ROOT, ROLES.ADMIN),
  postAction,
);

export default router;
