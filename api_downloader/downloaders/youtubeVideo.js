import path from 'node:path';
import localSetting from '../Setting.js';
import {
  buildYouTubePlaylistOriginalFileName,
  parseYouTubePlaylistUrl,
} from '../utils/youTubePlaylistUrl.js';
import {
  buildYouTubeShortsOriginalFileName,
  parseYouTubeShortsUrl,
} from '../utils/youTubeShortsUrl.js';
import {
  buildYouTubeWatchOriginalFileName,
  parseYouTubeWatchUrl,
} from '../utils/youTubeWatchUrl.js';

export const source = localSetting.SOURCE_YOUTUBE;
export const site = localSetting.SITE_YOUTUBE_COM;

function parseYouTubeVideoUrl(rawUrl) {
  return parseYouTubeWatchUrl(rawUrl)
    || parseYouTubeShortsUrl(rawUrl)
    || parseYouTubePlaylistUrl(rawUrl);
}

function buildOriginalFileName(rawUrl, videoId, ext) {
  if (parseYouTubeShortsUrl(rawUrl)) {
    return buildYouTubeShortsOriginalFileName(videoId, ext);
  }
  if (parseYouTubePlaylistUrl(rawUrl)) {
    return buildYouTubePlaylistOriginalFileName(videoId, ext);
  }
  return buildYouTubeWatchOriginalFileName(videoId, ext);
}

export function resolveExpectedMediaId(row) {
  const parsed = parseYouTubeVideoUrl(row?.url);
  if (!parsed?.videoId) {
    return null;
  }
  return String(parsed.videoId);
}

export function assertTargetMatches(row, info) {
  const expected = resolveExpectedMediaId(row);
  if (!expected) {
    throw new Error('missing expected media id from url');
  }

  const actual = info?.id;
  if (actual === undefined || actual === null || String(actual).trim() === '') {
    throw new Error('missing media id');
  }

  if (String(actual) !== expected) {
    throw new Error(`expected ${expected} got ${actual}`);
  }
}

export function resolveOriginalFileName(row, { diskFileName, originalFileName }) {
  const parsed = parseYouTubeVideoUrl(row?.url);
  if (!parsed?.videoId) {
    return originalFileName;
  }

  const ext = path.extname(String(diskFileName || '')).replace(/^\./, '') || 'mp4';
  return buildOriginalFileName(row?.url, parsed.videoId, ext);
}

export default {
  source,
  site,
  resolveExpectedMediaId,
  assertTargetMatches,
  resolveOriginalFileName,
};
