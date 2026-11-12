import { ACCOUNT_PASSWORD, LOGOUT } from '../../api/ApiUrl.js';
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from '../../database/Setting.js';
import { CHANGE_PASSWORD, HOME, LOGIN, SESSIONS } from '../HomeUrl.js';

const PAGE_TITLE = 'Change password';
const VIEW_CHANGE_PASSWORD = 'ChangePasswordView';

export function index(req, res) {
  res.render(VIEW_CHANGE_PASSWORD, {
    title: PAGE_TITLE,
    homePath: HOME,
    sessionsPath: SESSIONS,
    changePasswordPath: CHANGE_PASSWORD,
    loginPath: LOGIN,
    logoutEndpoint: LOGOUT,
    changePasswordEndpoint: ACCOUNT_PASSWORD,
    passwordMinLength: PASSWORD_MIN_LENGTH,
    passwordMaxLength: PASSWORD_MAX_LENGTH,
    account: res.locals.account,
  });
}

export default {
  index,
};
