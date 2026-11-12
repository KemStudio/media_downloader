import localSetting from './Setting.js';

export async function kickMediaDownload() {
  const scheduler = await import('./LocalCronScheduler.js');
  scheduler.kick(localSetting.JOB_MEDIA_DOWNLOAD_KEY);
}

export default {
  kickMediaDownload,
};
