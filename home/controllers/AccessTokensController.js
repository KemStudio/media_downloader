import {
  ACCESS_TOKENS as ACCESS_TOKENS_API,
  ACCESS_TOKEN_BY_ID,
  ACCESS_TOKEN_STATE,
} from '../../api/ApiUrl.js';
import { ACCESS_TOKENS_PAGE_LIMIT } from '../../api/utils/accessToken.js';
import { STATE, STATES as ACCOUNT_STATES } from '../../database/model/Account.js';
import { STATES } from '../../database/model/AccessToken.js';

const PAGE_TITLE = 'Access tokens';
const VIEW_ACCESS_TOKENS = 'AccessTokensView';

export function index(req, res) {
  const accountState = res.locals.account?.[STATE] || '';
  const canCreate = accountState === ACCOUNT_STATES.ACTIVE;

  res.render(VIEW_ACCESS_TOKENS, {
    title: PAGE_TITLE,
    accessTokensEndpoint: ACCESS_TOKENS_API,
    accessTokenStateTemplate: ACCESS_TOKEN_STATE,
    accessTokenByIdTemplate: ACCESS_TOKEN_BY_ID,
    accessTokensPageLimit: ACCESS_TOKENS_PAGE_LIMIT,
    accessTokenStates: STATES,
    canCreateAccessToken: canCreate,
    account: res.locals.account,
  });
}

export default {
  index,
};
