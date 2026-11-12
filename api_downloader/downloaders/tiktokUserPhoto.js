import path from 'node:path';
import localSetting from '../Setting.js';
import {
  DISK_FILE_NAME,
  DOWNLOAD_MEDIA_ID,
  ID as FILE_ID,
  ORIGINAL_FILE_NAME,
} from '../../database/model/DownloadFile.js';
import { ID, URL } from '../../database/model/DownloadMedia.js';
import { create as createDownloadFile } from '../../database/modelCRUD/downloadFile/Create.js';
import { update as updateDownloadFile } from '../../database/modelCRUD/downloadFile/Update.js';
import {
  buildTikTokUserPhotoOriginalFileName,
  parseTikTokUserPhotoUrl,
} from '../utils/tikTokUserPhotoUrl.js';
import {
  diskFileNameForPhoto,
  downloadCdnImage,
  parseTikTokUserPhotoImages,
  fetchTikTokPhotoHtml,
} from '../utils/tikTokUserPhotoPage.js';

export const source = localSetting.SOURCE_TIKTOK;
export const site = localSetting.SITE_TIKTOK_COM;

export async function download({ db, row, outputDir, stem }) {
  const parsed = parseTikTokUserPhotoUrl(row?.[URL]);
  if (!parsed?.photoId) {
    throw new Error('missing expected media id from url');
  }

  if (!stem || stem !== path.basename(stem)) {
    throw new Error('output stem is invalid');
  }

  const html = await fetchTikTokPhotoHtml(row[URL]);
  const images = parseTikTokUserPhotoImages(html, parsed.photoId);
  const mediaId = row[ID];

  for (let offset = 0; offset < images.length; offset += 1) {
    const index = offset + 1;
    const image = images[offset];
    const diskFileName = diskFileNameForPhoto(stem, index, image.ext, images.length);
    const fileRow = createDownloadFile(db, {
      [DOWNLOAD_MEDIA_ID]: mediaId,
      [DISK_FILE_NAME]: diskFileName,
      [ORIGINAL_FILE_NAME]: null,
    });

    await downloadCdnImage(image.url, path.join(outputDir, diskFileName), row[URL]);

    const saved = updateDownloadFile(db, fileRow[FILE_ID], {
      [ORIGINAL_FILE_NAME]: buildTikTokUserPhotoOriginalFileName(
        parsed.userName,
        parsed.photoId,
        index,
        image.ext,
      ),
    });

    if (!saved?.[ORIGINAL_FILE_NAME]) {
      throw new Error('download file update failed');
    }
  }
}

export default {
  source,
  site,
  download,
};
