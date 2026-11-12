import { Router } from 'express';
import { ROLES } from '../../database/model/Account.js';
import { requireApiAuth } from '../../api/middleware/requireApiAuth.js';
import { requireApiRoles } from '../../api/middleware/requireApiRoles.js';
import { getAction } from '../controllers/ListController.js';
import { LIST } from '../CronUrl.js';

const router = Router();

router.get(LIST, requireApiAuth, requireApiRoles(ROLES.ROOT, ROLES.ADMIN), getAction);

export default router;
