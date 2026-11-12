import { LOGIN as LOGIN_API } from '../../api/ApiUrl.js';
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
} from '../../database/Setting.js';
import { LOGIN, REGISTER } from '../HomeUrl.js';

const PAGE_TITLE = 'Sign in';
const VIEW_LOGIN = 'LoginView';

export function index(req, res) {
  res.render(VIEW_LOGIN, {
    title: PAGE_TITLE,
    loginPath: LOGIN,
    registerPath: REGISTER,
    apiEndpoint: LOGIN_API,
    usernameMinLength: USERNAME_MIN_LENGTH,
    usernameMaxLength: USERNAME_MAX_LENGTH,
    passwordMinLength: PASSWORD_MIN_LENGTH,
    passwordMaxLength: PASSWORD_MAX_LENGTH,
  });
}

export default {
  index,
};
