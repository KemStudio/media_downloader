import path from 'node:path';
import localSetting from '../Setting.js';
import {
  buildTikTokUserVideoOriginalFileName,
  parseTikTokUserVideoUrl,
} from '../utils/tikTokUserVideoUrl.js';

export const source = localSetting.SOURCE_TIKTOK;
export const site = localSetting.SITE_TIKTOK_COM;

export function resolveExpectedMediaId(row) {
  const parsed = parseTikTokUserVideoUrl(row?.url);
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
  const parsed = parseTikTokUserVideoUrl(row?.url);
  if (!parsed) {
    return originalFileName;
  }

  const ext = path.extname(String(diskFileName || '')).replace(/^\./, '') || 'mp4';
  return buildTikTokUserVideoOriginalFileName(parsed.userName, parsed.videoId, ext);
}

export default {
  source,
  site,
  resolveExpectedMediaId,
  assertTargetMatches,
  resolveOriginalFileName,
};
