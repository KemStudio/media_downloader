import { DOWNLOAD_MEDIA_ID, TABLE_NAME } from '../../model/DownloadFile.js';

export function removeByMediaId(db, downloadMediaId) {
  if (!Number.isInteger(downloadMediaId) || downloadMediaId < 1) {
    throw new Error('download_media_id must be a positive integer');
  }

  const result = db
    .prepare(
      `DELETE FROM ${TABLE_NAME}
       WHERE ${DOWNLOAD_MEDIA_ID} = ?`,
    )
    .run(downloadMediaId);

  return result.changes;
}

export default {
  removeByMediaId,
};
