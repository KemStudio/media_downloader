import { ID } from '../../database/model/Account.js';
import { DATA, ID as SESSION_ID } from '../../database/model/Session.js';

export const ACCOUNT_ID_SESSION_KEY = 'accountId';
export const USER_AGENT_SESSION_KEY = 'userAgent';
export const IP_SESSION_KEY = 'ip';
export const CREATED_AT_SESSION_KEY = 'createdAt';
export const LAST_SEEN_AT_SESSION_KEY = 'lastSeenAt';

export const SESSIONS_PAGE_LIMIT = 20;

export function setSessionAccount(req, account, metadata = {}) {
  const now = new Date().toISOString();
  const userAgent =
    metadata.userAgent !== undefined
      ? metadata.userAgent
      : (req.get?.('user-agent') ?? null);
  const ip =
    metadata.ip !== undefined
      ? metadata.ip
      : (req.ip ?? null);

  req.session[ACCOUNT_ID_SESSION_KEY] = account[ID];
  req.session[USER_AGENT_SESSION_KEY] = userAgent;
  req.session[IP_SESSION_KEY] = ip;
  req.session[CREATED_AT_SESSION_KEY] = now;
  req.session[LAST_SEEN_AT_SESSION_KEY] = now;
}

export function touchSessionLastSeen(req) {
  if (!req.session?.[ACCOUNT_ID_SESSION_KEY]) {
    return;
  }

  req.session[LAST_SEEN_AT_SESSION_KEY] = new Date().toISOString();
}

export function parseStartIndex(raw) {
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

  if (!Number.isInteger(value) || value < 0) {
    return null;
  }

  return value;
}

export function parseSessionData(rawData) {
  try {
    return JSON.parse(rawData);
  } catch {
    return {};
  }
}

export function isExpired(expiresAt) {
  return new Date(expiresAt).getTime() <= Date.now();
}

export function sameAccountId(left, right) {
  return Number(left) === Number(right);
}

export function toSessionItem(row, currentSessionId) {
  const data = parseSessionData(row[DATA]);

  return {
    id: row[SESSION_ID],
    userAgent: data[USER_AGENT_SESSION_KEY] ?? null,
    ip: data[IP_SESSION_KEY] ?? null,
    createdAt: data[CREATED_AT_SESSION_KEY] ?? null,
    lastSeenAt: data[LAST_SEEN_AT_SESSION_KEY] ?? null,
    isCurrent: row[SESSION_ID] === currentSessionId,
  };
}

export default {
  ACCOUNT_ID_SESSION_KEY,
  USER_AGENT_SESSION_KEY,
  IP_SESSION_KEY,
  CREATED_AT_SESSION_KEY,
  LAST_SEEN_AT_SESSION_KEY,
  SESSIONS_PAGE_LIMIT,
  setSessionAccount,
  touchSessionLastSeen,
  parseStartIndex,
  parseSessionData,
  isExpired,
  sameAccountId,
  toSessionItem,
};
