import {
  LOGOUT,
  SESSIONS as SESSIONS_API,
  SESSIONS_LOGOUT,
  SESSIONS_LOGOUT_OTHERS,
} from '../../api/ApiUrl.js';
import { SESSIONS_PAGE_LIMIT } from '../../api/utils/session.js';
import { CHANGE_PASSWORD, HOME, LOGIN, SESSIONS } from '../HomeUrl.js';

const PAGE_TITLE = 'Sessions';
const VIEW_SESSIONS = 'SessionsView';

export function index(req, res) {
  res.render(VIEW_SESSIONS, {
    title: PAGE_TITLE,
    homePath: HOME,
    sessionsPath: SESSIONS,
    changePasswordPath: CHANGE_PASSWORD,
    loginPath: LOGIN,
    logoutEndpoint: LOGOUT,
    sessionsEndpoint: SESSIONS_API,
    sessionsLogoutTemplate: SESSIONS_LOGOUT,
    sessionsLogoutOthersEndpoint: SESSIONS_LOGOUT_OTHERS,
    sessionsPageLimit: SESSIONS_PAGE_LIMIT,
    account: res.locals.account,
  });
}

export default {
  index,
};
