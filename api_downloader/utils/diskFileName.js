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

function isStemArtifactName(name, stem) {
  return name === stem
    || name.startsWith(`${stem}.`)
    || name.startsWith(`${stem}_`);
}

export async function findDownloadedFiles(dir, stem) {
  const entries = await fs.promises.readdir(dir);
  const matches = [];

  for (const name of entries) {
    if (!isStemArtifactName(name, stem) || name.endsWith('.part')) {
      continue;
    }
    const filePath = path.join(dir, name);
    const stats = await fs.promises.stat(filePath);
    if (stats.isFile() && stats.size > 0) {
      matches.push({ name, filePath, size: stats.size });
    }
  }

  matches.sort((left, right) => left.name.localeCompare(right.name, 'en'));
  return matches;
}

export async function findDownloadedFile(dir, stem) {
  const matches = await findDownloadedFiles(dir, stem);
  if (!matches.length) {
    return null;
  }

  return [...matches].sort((left, right) => right.size - left.size)[0];
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
      .filter((name) => (
        name === stem
        || name.startsWith(`${stem}.`)
        || name.startsWith(`${stem}_`)
      ))
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
  findDownloadedFiles,
  removeStemArtifacts,
};
