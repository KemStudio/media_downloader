import { LOGOUT } from '../../api/ApiUrl.js';
import { HOME, LOGIN } from '../HomeUrl.js';

const PAGE_TITLE = 'Media Downloader';
const VIEW_HOME = 'HomeView';

export function index(req, res) {
  res.render(VIEW_HOME, {
    title: PAGE_TITLE,
    homePath: HOME,
    loginPath: LOGIN,
    logoutEndpoint: LOGOUT,
    account: res.locals.account,
  });
}

export default {
  index,
};
