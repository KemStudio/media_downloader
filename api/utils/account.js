import { PASSWORD_HASH } from '../../database/model/Account.js';

export function toPublicAccount(account) {
  if (!account) {
    return null;
  }

  const { [PASSWORD_HASH]: _passwordHash, ...publicAccount } = account;
  return publicAccount;
}

export default {
  toPublicAccount,
};
