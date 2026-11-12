import { sanitizeOriginalFileName } from './diskFileName.js';

const ALLOWED_HOSTS = new Set(['tiktok.com', 'www.tiktok.com']);
const USER_VIDEO_PATH = /^\/@([^/]+)\/video\/(\d+)\/?$/;
const DEFAULT_EXT = 'mp4';

export function buildTikTokUserVideoOriginalFileName(userName, videoId, ext = DEFAULT_EXT) {
  const safeExt = String(ext || DEFAULT_EXT).replace(/^\./, '') || DEFAULT_EXT;
  return sanitizeOriginalFileName(`${userName}_${videoId}.${safeExt}`);
}

export function parseTikTokUserVideoUrl(rawUrl) {
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

  const match = USER_VIDEO_PATH.exec(parsed.pathname);
  if (!match) {
    return null;
  }

  return {
    userName: match[1],
    videoId: match[2],
  };
}

export function validateTikTokUserVideoUrl(raw) {
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

  const match = USER_VIDEO_PATH.exec(parsed.pathname);
  if (!match) {
    return {
      ok: false,
      error: 'url must be https://www.tiktok.com/@{user_name}/video/{video_id}',
    };
  }

  const userName = match[1];
  const videoId = match[2];
  parsed.hash = '';
  parsed.search = '';
  parsed.pathname = `/@${userName}/video/${videoId}`;

  return {
    ok: true,
    url: parsed.toString(),
    userName,
    videoId,
    originalFileName: buildTikTokUserVideoOriginalFileName(userName, videoId),
  };
}

export default {
  buildTikTokUserVideoOriginalFileName,
  parseTikTokUserVideoUrl,
  validateTikTokUserVideoUrl,
};
