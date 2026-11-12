import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  USERNAME_PATTERN,
} from '../../Setting.js';
import { USERNAME } from '../../model/Account.js';

export function assertValidUsername(username) {
  if (typeof username !== 'string' || username.length === 0) {
    throw new Error(`${USERNAME} is required`);
  }

  if (username.length < USERNAME_MIN_LENGTH || username.length > USERNAME_MAX_LENGTH) {
    throw new Error(
      `${USERNAME} must be between ${USERNAME_MIN_LENGTH} and ${USERNAME_MAX_LENGTH} characters`,
    );
  }

  if (!USERNAME_PATTERN.test(username)) {
    throw new Error(`${USERNAME} may only contain letters, numbers, and underscores`);
  }
}

export function assertValidPassword(password) {
  if (typeof password !== 'string' || password.length === 0) {
    throw new Error('password is required');
  }

  if (password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH) {
    throw new Error(
      `password must be between ${PASSWORD_MIN_LENGTH} and ${PASSWORD_MAX_LENGTH} characters`,
    );
  }
}

export function assertValidCredentials(username, password) {
  assertValidUsername(username);
  assertValidPassword(password);
}
