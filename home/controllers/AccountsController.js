import {
  ACCOUNT_BY_ID,
  ACCOUNT_STATE,
  ACCOUNTS as ACCOUNTS_API,
} from '../../api/ApiUrl.js';
import { ACCOUNTS_PAGE_LIMIT } from '../../api/utils/account.js';
import { ROLE, ROLES, STATES } from '../../database/model/Account.js';

const PAGE_TITLE = 'Accounts';
const VIEW_ACCOUNTS = 'AccountsView';

export function index(req, res) {
  res.render(VIEW_ACCOUNTS, {
    title: PAGE_TITLE,
    accountsEndpoint: ACCOUNTS_API,
    accountStateTemplate: ACCOUNT_STATE,
    accountByIdTemplate: ACCOUNT_BY_ID,
    accountsPageLimit: ACCOUNTS_PAGE_LIMIT,
    accountStates: STATES,
    viewerRole: res.locals.account?.[ROLE] || '',
    canDeleteAccounts: res.locals.account?.[ROLE] === ROLES.ROOT,
    account: res.locals.account,
  });
}

export default {
  index,
};
