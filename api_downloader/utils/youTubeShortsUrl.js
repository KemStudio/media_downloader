import { sanitizeOriginalFileName } from './diskFileName.js';

const ALLOWED_HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com']);
const SHORTS_PATH = /^\/shorts\/([A-Za-z0-9_-]{11})\/?$/;
const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;
const DEFAULT_EXT = 'mp4';

export function buildYouTubeShortsOriginalFileName(videoId, ext = DEFAULT_EXT) {
  const safeExt = String(ext || DEFAULT_EXT).replace(/^\./, '') || DEFAULT_EXT;
  return sanitizeOriginalFileName(`${videoId}.${safeExt}`);
}

export function parseYouTubeShortsUrl(rawUrl) {
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

  const match = SHORTS_PATH.exec(parsed.pathname);
  if (!match) {
    return null;
  }

  const videoId = match[1];
  if (!VIDEO_ID_PATTERN.test(videoId)) {
    return null;
  }

  return { videoId };
}

export function validateYouTubeShortsUrl(raw) {
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
    return {
      ok: false,
      error: 'url host must be youtube.com, www.youtube.com, or m.youtube.com',
    };
  }

  const match = SHORTS_PATH.exec(parsed.pathname);
  if (!match) {
    return {
      ok: false,
      error: 'url must be https://www.youtube.com/shorts/{video_id}',
    };
  }

  const videoId = match[1];
  const normalized = new URL(`https://www.youtube.com/shorts/${videoId}`);

  return {
    ok: true,
    url: normalized.toString(),
    videoId,
    originalFileName: buildYouTubeShortsOriginalFileName(videoId),
  };
}

export default {
  buildYouTubeShortsOriginalFileName,
  parseYouTubeShortsUrl,
  validateYouTubeShortsUrl,
};
