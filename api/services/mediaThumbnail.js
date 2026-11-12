import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import ffmpegPath from 'ffmpeg-static';
import sharp from 'sharp';

const THUMBNAIL_SUFFIX = '.thumbnail.jpg';
const MAX_EDGE = 256;
const JPEG_QUALITY = 80;
const VIDEO_SEEK_RATIO = 0.1;

const IMAGE_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
  '.avif',
  '.bmp',
  '.tif',
  '.tiff',
]);

const VIDEO_EXTENSIONS = new Set([
  '.mp4',
  '.webm',
  '.mov',
  '.mkv',
  '.m4v',
]);

export class UnsupportedThumbnailMediaError extends Error {
  constructor(message = 'unsupported media type for thumbnail') {
    super(message);
    this.name = 'UnsupportedThumbnailMediaError';
    this.code = 'UNSUPPORTED_THUMBNAIL_MEDIA';
  }
}

export function thumbnailPathFor(absPath) {
  return `${absPath}${THUMBNAIL_SUFFIX}`;
}

export function isThumbnailFileName(name) {
  return String(name || '').toLowerCase().endsWith(THUMBNAIL_SUFFIX);
}

function extensionOf(absPath) {
  return path.extname(absPath).toLowerCase();
}

function mediaKind(absPath) {
  const ext = extensionOf(absPath);
  if (IMAGE_EXTENSIONS.has(ext)) {
    return 'image';
  }
  if (VIDEO_EXTENSIONS.has(ext)) {
    return 'video';
  }
  return null;
}

async function thumbnailExists(thumbPath) {
  try {
    const stats = await fs.promises.stat(thumbPath);
    return stats.isFile() && stats.size > 0;
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}

async function writeJpegThumbnail(input, thumbPath) {
  const tempPath = `${thumbPath}.${randomUUID()}.tmp`;
  try {
    await sharp(input)
      .rotate()
      .resize(MAX_EDGE, MAX_EDGE, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: JPEG_QUALITY })
      .toFile(tempPath);
    await fs.promises.rename(tempPath, thumbPath);
  } catch (error) {
    try {
      await fs.promises.unlink(tempPath);
    } catch (unlinkError) {
      if (unlinkError?.code !== 'ENOENT') {
        throw unlinkError;
      }
    }
    throw error;
  }
}

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    if (!ffmpegPath) {
      reject(new Error('ffmpeg-static binary is not available'));
      return;
    }

    const child = spawn(ffmpegPath, args, {
      windowsHide: true,
      stdio: ['ignore', 'ignore', 'pipe'],
    });

    let stderr = '';
    child.stderr.setEncoding('utf8');
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });

    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve(stderr);
        return;
      }
      const detail = stderr.trim().split('\n').slice(-8).join('\n');
      reject(new Error(detail || `ffmpeg exited with code ${code}`));
    });
  });
}

function parseDurationSeconds(ffmpegStderr) {
  const match = /Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/i.exec(ffmpegStderr);
  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3]);
  if (![hours, minutes, seconds].every((value) => Number.isFinite(value))) {
    return null;
  }

  return (hours * 3600) + (minutes * 60) + seconds;
}

/** ffmpeg -i writes metadata to stderr and exits non-zero. */
function probeFfmpegStderr(absPath) {
  return new Promise((resolve, reject) => {
    if (!ffmpegPath) {
      reject(new Error('ffmpeg-static binary is not available'));
      return;
    }

    const child = spawn(ffmpegPath, ['-hide_banner', '-i', absPath], {
      windowsHide: true,
      stdio: ['ignore', 'ignore', 'pipe'],
    });

    let stderr = '';
    child.stderr.setEncoding('utf8');
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });

    child.on('error', reject);
    child.on('close', () => {
      resolve(stderr);
    });
  });
}

async function createImageThumbnail(absPath, thumbPath) {
  await writeJpegThumbnail(absPath, thumbPath);
}

async function createVideoThumbnail(absPath, thumbPath) {
  const stderr = await probeFfmpegStderr(absPath);
  let duration = parseDurationSeconds(stderr);
  if (duration === null || !(duration > 0)) {
    duration = 1;
  }

  const seekSeconds = Math.max(0, duration * VIDEO_SEEK_RATIO);
  const framePath = path.join(os.tmpdir(), `media-thumb-${randomUUID()}.jpg`);

  try {
    await runFfmpeg([
      '-hide_banner',
      '-loglevel',
      'error',
      '-ss',
      String(seekSeconds),
      '-i',
      absPath,
      '-frames:v',
      '1',
      '-q:v',
      '2',
      '-y',
      framePath,
    ]);

    await writeJpegThumbnail(framePath, thumbPath);
  } finally {
    try {
      await fs.promises.unlink(framePath);
    } catch (error) {
      if (error?.code !== 'ENOENT') {
        throw error;
      }
    }
  }
}

export async function ensureThumbnail(absPath) {
  const thumbPath = thumbnailPathFor(absPath);
  if (await thumbnailExists(thumbPath)) {
    return thumbPath;
  }

  const kind = mediaKind(absPath);
  if (kind === 'image') {
    await createImageThumbnail(absPath, thumbPath);
    return thumbPath;
  }
  if (kind === 'video') {
    await createVideoThumbnail(absPath, thumbPath);
    return thumbPath;
  }

  throw new UnsupportedThumbnailMediaError();
}

export default {
  THUMBNAIL_SUFFIX,
  UnsupportedThumbnailMediaError,
  thumbnailPathFor,
  isThumbnailFileName,
  ensureThumbnail,
};
