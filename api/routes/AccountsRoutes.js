import { Router } from 'express';
import { ROLES } from '../../database/model/Account.js';
import {
  ACCOUNT_BY_ID,
  ACCOUNT_ROLE,
  ACCOUNT_STATE,
  ACCOUNTS,
} from '../ApiUrl.js';
import {
  list,
  removeAccount,
  updateRole,
  updateState,
} from '../controllers/AccountsController.js';
import { requireApiRoles } from '../middleware/requireApiRoles.js';

const router = Router();

router.get(ACCOUNTS, requireApiRoles(ROLES.ROOT, ROLES.ADMIN), list);
router.patch(ACCOUNT_STATE, requireApiRoles(ROLES.ROOT, ROLES.ADMIN), updateState);
router.patch(ACCOUNT_ROLE, requireApiRoles(ROLES.ROOT), updateRole);
router.delete(ACCOUNT_BY_ID, requireApiRoles(ROLES.ROOT), removeAccount);

export default router;
