import { Router } from 'express';
import { ROLES } from '../../database/model/Account.js';
import { index } from '../controllers/AccountsController.js';
import { ACCOUNTS } from '../HomeUrl.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireRoles } from '../middleware/requireRoles.js';

const router = Router();

router.get(ACCOUNTS, requireAuth, requireRoles(ROLES.ROOT, ROLES.ADMIN), index);

export default router;
