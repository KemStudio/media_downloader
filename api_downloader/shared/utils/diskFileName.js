import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const MEDIA_ROOT = path.join(__dirname, '..', '..', 'data', 'medias');

export function mediaDirFor(source, site) {
  return path.join(MEDIA_ROOT, source, site);
}

export function outputTemplateFor(dir, stem) {
  return path.join(dir, `${stem}.%(ext)s`);
}

export function sanitizeOriginalFileName(value) {
  const base = path.basename(String(value || 'media').trim() || 'media');
  const cleaned = base
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_')
    .replace(/\s+/g, ' ')
    .trim();
  return (cleaned || 'media').slice(0, 255);
}

export async function ensureMediaDir(source, site) {
  const dir = mediaDirFor(source, site);
  await fs.promises.mkdir(dir, { recursive: true });
  return dir;
}

export async function findDownloadedFile(dir, stem) {
  const entries = await fs.promises.readdir(dir);
  const matches = [];

  for (const name of entries) {
    if (name === stem || name.startsWith(`${stem}.`)) {
      if (name.endsWith('.part')) {
        continue;
      }
      const filePath = path.join(dir, name);
      const stats = await fs.promises.stat(filePath);
      if (stats.isFile()) {
        matches.push({ name, filePath, size: stats.size });
      }
    }
  }

  if (!matches.length) {
    return null;
  }

  matches.sort((left, right) => right.size - left.size);
  return matches[0];
}

export async function removeStemArtifacts(dir, stem) {
  let entries = [];
  try {
    entries = await fs.promises.readdir(dir);
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return;
    }
    throw error;
  }

  await Promise.all(
    entries
      .filter((name) => name === stem || name.startsWith(`${stem}.`))
      .map(async (name) => {
        try {
          await fs.promises.unlink(path.join(dir, name));
        } catch (error) {
          if (error?.code !== 'ENOENT') {
            throw error;
          }
        }
      }),
  );
}

export default {
  MEDIA_ROOT,
  mediaDirFor,
  outputTemplateFor,
  sanitizeOriginalFileName,
  ensureMediaDir,
  findDownloadedFile,
  removeStemArtifacts,
};
