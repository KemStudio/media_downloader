import { Router } from 'express';
import {
  ACCESS_TOKENS,
  ACCESS_TOKEN_BY_ID,
  ACCESS_TOKEN_STATE,
} from '../ApiUrl.js';
import {
  createAccessToken,
  list,
  removeAccessToken,
  updateState,
} from '../controllers/AccessTokensController.js';
import { requireApiAuth } from '../middleware/requireApiAuth.js';

const router = Router();

router.get(ACCESS_TOKENS, requireApiAuth, list);
router.post(ACCESS_TOKENS, requireApiAuth, createAccessToken);
router.patch(ACCESS_TOKEN_STATE, requireApiAuth, updateState);
router.delete(ACCESS_TOKEN_BY_ID, requireApiAuth, removeAccessToken);

export default router;
