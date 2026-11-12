import { Router } from 'express';
import { enqueue } from '../controllers/YouTubePlaylistController.js';
import { YOUTUBE_PLAYLIST } from '../DownloaderUrl.js';
import { requireBearerAccessToken } from '../middleware/requireBearerAccessToken.js';

const router = Router();

router.post(YOUTUBE_PLAYLIST, requireBearerAccessToken, enqueue);

export default router;
