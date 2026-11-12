import { MEDIA_DOWNLOAD, MEDIA_LIST } from '../../api/ApiUrl.js';
import { MEDIA_PAGE_LIMIT } from '../../api_downloader/Setting.js';
import { STATUSES } from '../../database/model/DownloadMedia.js';

const PAGE_TITLE = 'Downloads';
const VIEW_DOWNLOADS = 'DownloadsView';
const MEDIA_DOWNLOAD_ENDPOINT = MEDIA_DOWNLOAD.replace('/:id', '');

export function index(req, res) {
  res.render(VIEW_DOWNLOADS, {
    title: PAGE_TITLE,
    mediaEndpoint: MEDIA_LIST,
    mediaDownloadEndpoint: MEDIA_DOWNLOAD_ENDPOINT,
    mediaPageLimit: MEDIA_PAGE_LIMIT,
    downloadStatuses: STATUSES,
    account: res.locals.account,
  });
}

export default {
  index,
};
