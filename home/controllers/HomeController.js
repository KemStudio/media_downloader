import { LOGOUT } from '../../api/ApiUrl.js';
import { CHANGE_PASSWORD, HOME, LOGIN, SESSIONS } from '../HomeUrl.js';

const PAGE_TITLE = 'Media Downloader';
const VIEW_HOME = 'HomeView';

export function index(req, res) {
  res.render(VIEW_HOME, {
    title: PAGE_TITLE,
    homePath: HOME,
    sessionsPath: SESSIONS,
    changePasswordPath: CHANGE_PASSWORD,
    loginPath: LOGIN,
    logoutEndpoint: LOGOUT,
    account: res.locals.account,
  });
}

export default {
  index,
};
