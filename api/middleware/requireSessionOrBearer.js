import { requireBearerAccessToken } from '../../api_downloader/middleware/requireBearerAccessToken.js';
import { requireApiAuth } from './requireApiAuth.js';

const BEARER_PREFIX = 'bearer ';

function hasBearerAuthorization(req) {
  const authorization = req.get('authorization');
  if (typeof authorization !== 'string') {
    return false;
  }

  return authorization.trim().toLowerCase().startsWith(BEARER_PREFIX);
}

export function requireSessionOrBearer(req, res, next) {
  if (hasBearerAuthorization(req)) {
    requireBearerAccessToken(req, res, next);
    return;
  }

  requireApiAuth(req, res, next);
}

export default {
  requireSessionOrBearer,
};
