const PAGE_TITLE = 'Media Downloader';
const VIEW_HOME = 'HomeView';

export function index(req, res) {
  res.render(VIEW_HOME, { title: PAGE_TITLE });
}

export default {
  index,
};
