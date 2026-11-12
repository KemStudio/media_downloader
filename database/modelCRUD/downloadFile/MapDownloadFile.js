import {
  DISK_FILE_NAME,
  DOWNLOAD_MEDIA_ID,
  ID,
  ORIGINAL_FILE_NAME,
} from '../../model/DownloadFile.js';

export function mapDownloadFile(row) {
  if (!row) {
    return null;
  }

  return {
    [ID]: row[ID],
    [DOWNLOAD_MEDIA_ID]: row[DOWNLOAD_MEDIA_ID],
    [DISK_FILE_NAME]: row[DISK_FILE_NAME],
    [ORIGINAL_FILE_NAME]: row[ORIGINAL_FILE_NAME],
  };
}

export default {
  mapDownloadFile,
};
