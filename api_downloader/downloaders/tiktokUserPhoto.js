import path from 'node:path';
import {
  DISK_FILE_NAME,
  DOWNLOAD_MEDIA_ID,
  ORIGINAL_FILE_NAME,
} from '../../database/model/DownloadFile.js';
import {
  ID,
  URL,
} from '../../database/model/DownloadMedia.js';
import { create as createDownloadFile } from '../../database/modelCRUD/downloadFile/Create.js';
import localSetting from '../Setting.js';
import {
  detailPageUrlForPhoto,
  diskFileNameForPhoto,
  downloadCdnImage,
  fetchTikTokPhotoHtml,
  parseTikTokUserPhotoImages,
} from '../utils/tikTokUserPhotoPage.js';
import {
  buildTikTokUserPhotoOriginalFileName,
  parseTikTokUserPhotoUrl,
} from '../utils/tikTokUserPhotoUrl.js';

export const source = localSetting.SOURCE_TIKTOK;
export const site = localSetting.SITE_TIKTOK_COM;

export function resolveExpectedMediaId(row) {
  const parsed = parseTikTokUserPhotoUrl(row?.url ?? row?.[URL]);
  if (!parsed?.photoId) {
    return null;
  }
  return String(parsed.photoId);
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

export function resolveOriginalFileName(row, { diskFileName, originalFileName, index = 1 }) {
  const parsed = parseTikTokUserPhotoUrl(row?.url ?? row?.[URL]);
  if (!parsed) {
    return originalFileName;
  }

  const ext = path.extname(String(diskFileName || '')).replace(/^\./, '') || 'jpeg';
  const imageIndex = Number.isInteger(Number(index)) && Number(index) >= 1
    ? Number(index)
    : 1;
  return buildTikTokUserPhotoOriginalFileName(parsed.userName, parsed.photoId, imageIndex, ext);
}

export async function download({ db, row, outputDir, stem }) {
  const mediaId = row?.[ID];
  if (!Number.isInteger(mediaId) || mediaId < 1) {
    throw new Error('download_media_id must be a positive integer');
  }

  const pageUrl = String(row?.[URL] || '').trim();
  const parsed = parseTikTokUserPhotoUrl(pageUrl);
  if (!parsed?.photoId) {
    throw new Error('missing expected media id from url');
  }

  const html = await fetchTikTokPhotoHtml(pageUrl);
  const images = parseTikTokUserPhotoImages(html, parsed.photoId);
  if (!images.length) {
    throw new Error('imagePost.images is missing');
  }

  const refererUrl = detailPageUrlForPhoto(pageUrl);

  for (let offset = 0; offset < images.length; offset += 1) {
    const index = offset + 1;
    const image = images[offset];
    const diskFileName = diskFileNameForPhoto(stem, index, image.ext, images.length);
    const filePath = path.join(outputDir, diskFileName);

    await downloadCdnImage(image.url, filePath, refererUrl);

    const originalFileName = resolveOriginalFileName(row, {
      diskFileName,
      originalFileName: diskFileName,
      index,
      fileCount: images.length,
    });

    const savedFile = createDownloadFile(db, {
      [DOWNLOAD_MEDIA_ID]: mediaId,
      [DISK_FILE_NAME]: diskFileName,
      [ORIGINAL_FILE_NAME]: originalFileName,
    });

    if (!savedFile) {
      throw new Error('failed to save download file row');
    }
  }
}

export default {
  source,
  site,
  resolveExpectedMediaId,
  assertTargetMatches,
  resolveOriginalFileName,
  download,
};
