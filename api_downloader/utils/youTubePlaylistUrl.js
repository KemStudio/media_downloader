import { sanitizeOriginalFileName } from './diskFileName.js';

const ALLOWED_HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com']);
const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;
const DEFAULT_EXT = 'mp4';

export function buildYouTubePlaylistOriginalFileName(videoId, ext = DEFAULT_EXT) {
  const safeExt = String(ext || DEFAULT_EXT).replace(/^\./, '') || DEFAULT_EXT;
  return sanitizeOriginalFileName(`${videoId}.${safeExt}`);
}

export function parseYouTubePlaylistUrl(rawUrl) {
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

  if (parsed.pathname !== '/watch' && parsed.pathname !== '/watch/') {
    return null;
  }

  const videoId = parsed.searchParams.get('v');
  const listId = parsed.searchParams.get('list');
  if (!videoId || !VIDEO_ID_PATTERN.test(videoId)) {
    return null;
  }
  if (typeof listId !== 'string' || !listId.trim()) {
    return null;
  }

  return {
    videoId,
    listId: listId.trim(),
  };
}

export function validateYouTubePlaylistUrl(raw) {
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
    return {
      ok: false,
      error: 'url must be https://www.youtube.com/watch?v={video_id}&list={list_id}',
    };
  }

  const videoId = parsed.searchParams.get('v');
  if (!videoId || !VIDEO_ID_PATTERN.test(videoId)) {
    return {
      ok: false,
      error: 'url must be https://www.youtube.com/watch?v={video_id}&list={list_id}',
    };
  }

  const listId = parsed.searchParams.get('list');
  if (typeof listId !== 'string' || !listId.trim()) {
    return { ok: false, error: 'url must include list; use the watch API for single videos' };
  }

  const normalized = new URL('https://www.youtube.com/watch');
  normalized.searchParams.set('v', videoId);
  normalized.searchParams.set('list', listId.trim());

  return {
    ok: true,
    url: normalized.toString(),
    videoId,
    listId: listId.trim(),
    originalFileName: buildYouTubePlaylistOriginalFileName(videoId),
  };
}

export default {
  buildYouTubePlaylistOriginalFileName,
  parseYouTubePlaylistUrl,
  validateYouTubePlaylistUrl,
};
