import {
  ACCOUNT_ID,
  CREATED_AT,
  ERROR_MESSAGE,
  FINISHED_AT,
  ID,
  SITE,
  SOURCE,
  STARTED_AT,
  STATUS,
  UPDATED_AT,
  URL,
} from '../../model/DownloadMedia.js';

export function mapDownloadMedia(row) {
  if (!row) {
    return null;
  }

  return {
    [ID]: row[ID],
    [ACCOUNT_ID]: row[ACCOUNT_ID],
    [SOURCE]: row[SOURCE],
    [SITE]: row[SITE],
    [URL]: row[URL],
    [STATUS]: row[STATUS],
    [ERROR_MESSAGE]: row[ERROR_MESSAGE],
    [CREATED_AT]: row[CREATED_AT],
    [UPDATED_AT]: row[UPDATED_AT],
    [STARTED_AT]: row[STARTED_AT],
    [FINISHED_AT]: row[FINISHED_AT],
  };
}

export default {
  mapDownloadMedia,
};
