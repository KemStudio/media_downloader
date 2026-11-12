import path from 'node:path';
import localSetting from '../Setting.js';
import {
  buildTikTokUserVideoOriginalFileName,
  parseTikTokUserVideoUrl,
} from '../utils/tikTokUserVideoUrl.js';

export const source = localSetting.SOURCE_TIKTOK;
export const site = localSetting.SITE_TIKTOK_COM;

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
  resolveOriginalFileName,
};
