import mediaDownloadJob from './jobs/media_download.js';

export const jobs = {};

export function register(job) {
  jobs[job.key] = job;
}

register(mediaDownloadJob);

export default {
  jobs,
  register,
};
