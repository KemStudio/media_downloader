import {
  STATES,
  TOKEN_HASH,
} from '../../database/model/AccessToken.js';

export const ACCESS_TOKENS_PAGE_LIMIT = 20;

const VALID_STATES = new Set(Object.values(STATES));

export function toPublicAccessToken(accessToken) {
  if (!accessToken) {
    return null;
  }

  const { [TOKEN_HASH]: _tokenHash, ...publicAccessToken } = accessToken;
  return publicAccessToken;
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

export function parseAccessTokenId(raw) {
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
  ACCESS_TOKENS_PAGE_LIMIT,
  toPublicAccessToken,
  parseStatesQuery,
  parseAccessTokenId,
};
