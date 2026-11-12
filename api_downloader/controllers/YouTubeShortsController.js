import { kickMediaDownload } from '../../api_cron_job/kickMediaDownload.js';
import { getDb } from '../../database/DataManager.js';
import {
  ACCOUNT_ID,
  SITE,
  SOURCE,
  URL,
} from '../../database/model/DownloadMedia.js';
import { create } from '../../database/modelCRUD/downloadMedia/Create.js';
import localSetting from '../Setting.js';
import { validateYouTubeShortsUrl } from '../utils/youTubeShortsUrl.js';

export function enqueue(req, res) {
  const accountId = Number(req.accountId);
  if (!Number.isInteger(accountId) || accountId < 1) {
    res.status(401).json({ error: 'invalid bearer token' });
    return;
  }

  const validated = validateYouTubeShortsUrl(req.body?.url);
  if (!validated.ok) {
    res.status(400).json({ error: validated.error });
    return;
  }

  try {
    create(getDb(), {
      [ACCOUNT_ID]: accountId,
      [SOURCE]: localSetting.SOURCE_YOUTUBE,
      [SITE]: localSetting.SITE_YOUTUBE_COM,
      [URL]: validated.url,
    });

    kickMediaDownload().catch((error) => {
      console.error(`youtube shorts enqueue kick failed: ${error}`);
    });

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export default {
  enqueue,
};
