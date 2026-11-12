import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import localSetting from '../../Setting.js';
import {
  findDownloadedFile,
  findDownloadedFiles,
  outputTemplateFor,
  sanitizeOriginalFileName,
} from '../../utils/diskFileName.js';

function resolveYtDlpPath() {
  const fromEnv = process.env.YT_DLP_PATH;
  if (typeof fromEnv === 'string' && fromEnv.trim()) {
    return fromEnv.trim();
  }
  return localSetting.YT_DLP_PATH;
}

function resolveTimeoutMs() {
  const raw = process.env.YTDLP_TIMEOUT_MS;
  if (raw === undefined || raw === null || String(raw).trim() === '') {
    return localSetting.YTDLP_TIMEOUT_MS;
  }
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1) {
    return localSetting.YTDLP_TIMEOUT_MS;
  }
  return value;
}

function resolveCookiesFile() {
  const fromEnv = process.env.YTDLP_COOKIES_FILE;
  if (typeof fromEnv !== 'string' || !fromEnv.trim()) {
    return null;
  }
  const cookiesPath = fromEnv.trim();
  if (!fs.existsSync(cookiesPath)) {
    return null;
  }
  return cookiesPath;
}

function buildArgs({ url, outputDir, outputStem, cookiesFile, extraArgs }) {
  const args = [
    '--no-playlist',
    '--no-progress',
    '--quiet',
    '--no-warnings',
    '--no-part',
    '--format',
    'bestvideo*+bestaudio/best',
    '--merge-output-format',
    'mp4',
    '--print',
    'after_move:%(filepath)s',
    '--print',
    'after_move:%(title)s.%(ext)s',
    '-o',
    outputTemplateFor(outputDir, outputStem),
  ];

  if (cookiesFile) {
    args.push('--cookies', cookiesFile);
  }

  if (Array.isArray(extraArgs) && extraArgs.length > 0) {
    args.push(...extraArgs);
  }

  args.push(url);
  return args;
}

function runYtDlp(ytDlpPath, args, timeoutMs) {
  return new Promise((resolve, reject) => {
    const child = spawn(ytDlpPath, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });

    let stdout = '';
    let stderr = '';
    let settled = false;
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
      setTimeout(() => {
        if (!settled) {
          child.kill('SIGKILL');
        }
      }, 5_000).unref?.();
    }, timeoutMs);

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      reject(error);
    });

    child.on('close', (code) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);

      if (timedOut) {
        reject(new Error(`yt-dlp timed out after ${timeoutMs}ms`));
        return;
      }

      if (code !== 0) {
        const detail = stderr.trim() || stdout.trim() || `yt-dlp exited with code ${code}`;
        reject(new Error(detail));
        return;
      }

      resolve({ stdout, stderr });
    });
  });
}

function parsePrintLines(stdout) {
  const lines = String(stdout || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const files = [];
  for (let index = 0; index + 1 < lines.length; index += 2) {
    files.push({
      filePath: lines[index] || null,
      originalName: lines[index + 1] || null,
    });
  }

  if (!files.length && lines[0]) {
    files.push({
      filePath: lines[0],
      originalName: lines[1] || null,
    });
  }

  return {
    filePath: files[0]?.filePath || null,
    originalName: files[0]?.originalName || null,
    files,
  };
}

export async function probe({ url, extraArgs } = {}) {
  if (typeof url !== 'string' || !url.trim()) {
    throw new Error('url is required');
  }

  const ytDlpPath = resolveYtDlpPath();
  const timeoutMs = resolveTimeoutMs();
  const cookiesFile = resolveCookiesFile();
  const args = [
    '--dump-single-json',
    '--no-playlist',
    '--no-warnings',
  ];

  if (cookiesFile) {
    args.push('--cookies', cookiesFile);
  }

  if (Array.isArray(extraArgs) && extraArgs.length > 0) {
    args.push(...extraArgs);
  }

  args.push(url.trim());

  const { stdout } = await runYtDlp(ytDlpPath, args, timeoutMs);

  try {
    return JSON.parse(stdout);
  } catch {
    throw new Error('yt-dlp probe returned invalid JSON');
  }
}

export async function download({ url, outputDir, outputStem, extraArgs } = {}) {
  if (typeof url !== 'string' || !url.trim()) {
    throw new Error('url is required');
  }
  if (typeof outputDir !== 'string' || !outputDir.trim()) {
    throw new Error('outputDir is required');
  }
  if (typeof outputStem !== 'string' || !outputStem.trim()) {
    throw new Error('outputStem is required');
  }

  await fs.promises.mkdir(outputDir, { recursive: true });

  const ytDlpPath = resolveYtDlpPath();
  const timeoutMs = resolveTimeoutMs();
  const cookiesFile = resolveCookiesFile();
  const args = buildArgs({
    url: url.trim(),
    outputDir,
    outputStem: outputStem.trim(),
    cookiesFile,
    extraArgs,
  });

  const { stdout } = await runYtDlp(ytDlpPath, args, timeoutMs);
  const printed = parsePrintLines(stdout);
  const stem = outputStem.trim();

  const printedFiles = [];
  for (const entry of printed.files) {
    if (!entry.filePath || !fs.existsSync(entry.filePath)) {
      continue;
    }
    const stats = await fs.promises.stat(entry.filePath);
    if (!stats.isFile() || stats.size < 1) {
      continue;
    }
    const diskFileName = path.basename(entry.filePath);
    printedFiles.push({
      filePath: entry.filePath,
      diskFileName,
      originalFileName: sanitizeOriginalFileName(entry.originalName || diskFileName),
      size: stats.size,
    });
  }

  let files = printedFiles;
  if (!files.length) {
    const found = await findDownloadedFiles(outputDir, stem);
    files = found.map((entry) => ({
      filePath: entry.filePath,
      diskFileName: entry.name,
      originalFileName: sanitizeOriginalFileName(entry.name),
      size: entry.size,
    }));
  }

  if (!files.length) {
    const found = await findDownloadedFile(outputDir, stem);
    if (!found) {
      throw new Error('yt-dlp did not produce an output file');
    }
    files = [{
      filePath: found.filePath,
      diskFileName: found.name,
      originalFileName: sanitizeOriginalFileName(found.name),
      size: found.size,
    }];
  }

  const primary = files[0];
  return {
    filePath: primary.filePath,
    diskFileName: primary.diskFileName,
    originalFileName: primary.originalFileName,
    size: primary.size,
    files,
  };
}

export default {
  probe,
  download,
};
