import { sanitizeOriginalFileName } from './diskFileName.js';

const ALLOWED_HOSTS = new Set(['tiktok.com', 'www.tiktok.com']);
const USER_PHOTO_PATH = /^\/@([^/]+)\/photo\/(\d+)\/?$/;
const DEFAULT_EXT = 'jpeg';

export function buildTikTokUserPhotoOriginalFileName(userName, photoId, index, ext = DEFAULT_EXT) {
  const imageIndex = Number(index);
  if (!Number.isInteger(imageIndex) || imageIndex < 1) {
    throw new Error('photo index must be a positive integer');
  }

  const safeExt = String(ext || DEFAULT_EXT).replace(/^\./, '') || DEFAULT_EXT;
  return sanitizeOriginalFileName(`${userName}_${photoId}_${imageIndex}.${safeExt}`);
}

export function parseTikTokUserPhotoUrl(rawUrl) {
  let parsed;
  try {
    parsed = new URL(String(rawUrl || '').trim());
  } catch {
    return null;
  }

  const hostname = parsed.hostname.toLowerCase();
  if (!ALLOWED_HOSTS.has(hostname)) {
    return null;
  }

  const match = USER_PHOTO_PATH.exec(parsed.pathname);
  if (!match) {
    return null;
  }

  return {
    userName: match[1],
    photoId: match[2],
  };
}

export function validateTikTokUserPhotoUrl(raw) {
  if (typeof raw !== 'string' || !raw.trim()) {
    return { ok: false, error: 'url is required' };
  }

  let parsed;
  try {
    parsed = new URL(raw.trim());
  } catch {
    return { ok: false, error: 'url is invalid' };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { ok: false, error: 'url must be http or https' };
  }

  const hostname = parsed.hostname.toLowerCase();
  if (!ALLOWED_HOSTS.has(hostname)) {
    return { ok: false, error: 'url host must be tiktok.com or www.tiktok.com' };
  }

  const match = USER_PHOTO_PATH.exec(parsed.pathname);
  if (!match) {
    return {
      ok: false,
      error: 'url must be https://www.tiktok.com/@{user_name}/photo/{photo_id}',
    };
  }

  const userName = match[1];
  const photoId = match[2];
  parsed.hash = '';
  parsed.search = '';
  parsed.pathname = `/@${userName}/photo/${photoId}`;

  return {
    ok: true,
    url: parsed.toString(),
    userName,
    photoId,
  };
}

export default {
  buildTikTokUserPhotoOriginalFileName,
  parseTikTokUserPhotoUrl,
  validateTikTokUserPhotoUrl,
};
