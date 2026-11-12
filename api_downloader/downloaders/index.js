import tiktokUserPhoto from './tiktokUserPhoto.js';
import tiktokUserVideo from './tiktokUserVideo.js';
import youtubeVideo from './youtubeVideo.js';

const DEFAULT_DOWNLOADER = {
  resolveOriginalFileName(_row, { originalFileName }) {
    return originalFileName;
  },
};

const registry = new Map([
  [registryKey(tiktokUserVideo.source, tiktokUserVideo.site), tiktokUserVideo],
  [registryKey(youtubeVideo.source, youtubeVideo.site), youtubeVideo],
]);

function registryKey(source, site) {
  return `${String(source || '').trim()}:${String(site || '').trim()}`;
}

function isPhotoPath(url) {
  try {
    return /\/photo(\/|$)/.test(new URL(String(url || '').trim()).pathname);
  } catch {
    return false;
  }
}

export function getDownloader(source, site, url) {
  const normalizedSource = String(source || '').trim();
  const normalizedSite = String(site || '').trim();
  if (
    normalizedSource === tiktokUserPhoto.source
    && normalizedSite === tiktokUserPhoto.site
    && isPhotoPath(url)
  ) {
    return tiktokUserPhoto;
  }

  return registry.get(registryKey(normalizedSource, normalizedSite)) || DEFAULT_DOWNLOADER;
}

export default {
  getDownloader,
};
