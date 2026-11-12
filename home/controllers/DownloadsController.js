import {
  MEDIA_DELETE,
  MEDIA_DOWNLOAD,
  MEDIA_LIST,
  MEDIA_LIST_FILES,
  MEDIA_THUMBNAIL,
} from '../../api/ApiUrl.js';
import { MEDIA_PAGE_LIMIT } from '../../api_downloader/Setting.js';
import { STATUSES } from '../../database/model/DownloadMedia.js';

const PAGE_TITLE = 'Media';
const VIEW_DOWNLOADS = 'DownloadsView';

export function index(req, res) {
  res.render(VIEW_DOWNLOADS, {
    title: PAGE_TITLE,
    mediaEndpoint: MEDIA_LIST,
    mediaFilesTemplate: MEDIA_LIST_FILES,
    mediaDownloadTemplate: MEDIA_DOWNLOAD,
    mediaDeleteTemplate: MEDIA_DELETE,
    mediaThumbnailTemplate: MEDIA_THUMBNAIL,
    mediaPageLimit: MEDIA_PAGE_LIMIT,
    downloadStatuses: STATUSES,
    account: res.locals.account,
  });
}

export default {
  index,
};
