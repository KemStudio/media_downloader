const PAGE_TITLE = 'Media Downloader';
const VIEW_HOME = 'HomeView';

export function index(req, res) {
  res.render(VIEW_HOME, {
    title: PAGE_TITLE,
    account: res.locals.account,
  });
}

export default {
  index,
};
