import { sanitizeOriginalFileName } from './diskFileName.js';

const ALLOWED_HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com']);
const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;
const DEFAULT_EXT = 'mp4';

export function buildYouTubeWatchOriginalFileName(videoId, ext = DEFAULT_EXT) {
  const safeExt = String(ext || DEFAULT_EXT).replace(/^\./, '') || DEFAULT_EXT;
  return sanitizeOriginalFileName(`${videoId}.${safeExt}`);
}

function parseHostname(rawUrl) {
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

  return parsed;
}

export function parseYouTubeWatchUrl(rawUrl) {
  const parsed = parseHostname(rawUrl);
  if (!parsed) {
    return null;
  }

  if (parsed.pathname !== '/watch' && parsed.pathname !== '/watch/') {
    return null;
  }

  if (parsed.searchParams.has('list')) {
    return null;
  }

  const videoId = parsed.searchParams.get('v');
  if (!videoId || !VIDEO_ID_PATTERN.test(videoId)) {
    return null;
  }

  return { videoId };
}

export function validateYouTubeWatchUrl(raw) {
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

  if (parsed.pathname !== '/watch' && parsed.pathname !== '/watch/') {
    return { ok: false, error: 'url must be https://www.youtube.com/watch?v={video_id}' };
  }

  if (parsed.searchParams.has('list')) {
    return { ok: false, error: 'url must not include list; use the playlist API' };
  }

  const videoId = parsed.searchParams.get('v');
  if (!videoId || !VIDEO_ID_PATTERN.test(videoId)) {
    return { ok: false, error: 'url must be https://www.youtube.com/watch?v={video_id}' };
  }

  const normalized = new URL('https://www.youtube.com/watch');
  normalized.searchParams.set('v', videoId);

  return {
    ok: true,
    url: normalized.toString(),
    videoId,
    originalFileName: buildYouTubeWatchOriginalFileName(videoId),
  };
}

export default {
  buildYouTubeWatchOriginalFileName,
  parseYouTubeWatchUrl,
  validateYouTubeWatchUrl,
};
