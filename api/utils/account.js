import { PASSWORD_HASH, STATES } from '../../database/model/Account.js';

export const ACCOUNTS_PAGE_LIMIT = 20;

const VALID_STATES = new Set(Object.values(STATES));

export function toPublicAccount(account) {
  if (!account) {
    return null;
  }

  const { [PASSWORD_HASH]: _passwordHash, ...publicAccount } = account;
  return publicAccount;
}

export function parseStatesQuery(raw) {
  if (raw === undefined || raw === null) {
    return null;
  }

  const chunks = Array.isArray(raw) ? raw : [raw];
  const states = [];
  const seen = new Set();

  for (const chunk of chunks) {
    if (typeof chunk !== 'string' && typeof chunk !== 'number') {
      return null;
    }

    for (const part of String(chunk).split(',')) {
      const state = part.trim();
      if (!state) {
        continue;
      }

      if (!VALID_STATES.has(state)) {
        return null;
      }

      if (!seen.has(state)) {
        seen.add(state);
        states.push(state);
      }
    }
  }

  if (states.length === 0) {
    return null;
  }

  return states;
}

export function parseAccountId(raw) {
  if (raw === undefined || raw === null) {
    return null;
  }

  if (Array.isArray(raw)) {
    return null;
  }

  if (typeof raw === 'string' && raw.trim() === '') {
    return null;
  }

  const value = typeof raw === 'number' ? raw : Number(raw);

  if (!Number.isInteger(value) || value < 1) {
    return null;
  }

  return value;
}

export default {
  ACCOUNTS_PAGE_LIMIT,
  toPublicAccount,
  parseStatesQuery,
  parseAccountId,
};
