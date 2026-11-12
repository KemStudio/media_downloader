import tiktokUserVideo from './tiktokUserVideo.js';

const DEFAULT_DOWNLOADER = {
  resolveOriginalFileName(_row, { originalFileName }) {
    return originalFileName;
  },
};

const registry = new Map([
  [registryKey(tiktokUserVideo.source, tiktokUserVideo.site), tiktokUserVideo],
]);

function registryKey(source, site) {
  return `${String(source || '').trim()}:${String(site || '').trim()}`;
}

export function getDownloader(source, site) {
  return registry.get(registryKey(source, site)) || DEFAULT_DOWNLOADER;
}

export default {
  getDownloader,
};
