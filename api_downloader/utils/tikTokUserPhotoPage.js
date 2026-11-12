import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import localSetting from '../Setting.js';

const REHYDRATION_SCRIPT_ID = '__UNIVERSAL_DATA_FOR_REHYDRATION__';
const DEFAULT_IMAGE_EXT = 'jpeg';
const CDN_HOSTS = Object.freeze(['tiktokcdn.com', 'tiktokcdn-us.com']);
const PAGE_HOSTS = new Set(['tiktok.com', 'www.tiktok.com']);
const DESKTOP_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const HTTPONLY_PREFIX = '#HttpOnly_';
const MAX_REDIRECTS = 5;
const EXT_PATTERN = /^[a-z0-9]{1,8}$/;
const COOKIE_NAME_PATTERN = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;
const PHOTO_PATH = /^\/@([^/]+)\/photo\/(\d+)\/?$/;
const CHALLENGE_MAX_NONCE = 1_000_000;

function timeoutMs(value, fallback) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }
  return parsed;
}

function pageTimeoutMs() {
  return timeoutMs(process.env.PHOTO_PAGE_TIMEOUT_MS, localSetting.PHOTO_PAGE_TIMEOUT_MS);
}

function imageTimeoutMs() {
  return timeoutMs(process.env.PHOTO_IMAGE_TIMEOUT_MS, localSetting.PHOTO_IMAGE_TIMEOUT_MS);
}

export function isTikTokCdnHost(hostname) {
  const host = String(hostname || '').toLowerCase();
  return CDN_HOSTS.some((cdnHost) => host === cdnHost || host.endsWith(`.${cdnHost}`));
}

export function extensionFromImageUrl(imageUrl) {
  let pathname = '';
  try {
    pathname = new URL(imageUrl).pathname;
  } catch {
    return DEFAULT_IMAGE_EXT;
  }

  const ext = path.extname(pathname).replace(/^\./, '').toLowerCase();
  if (!EXT_PATTERN.test(ext)) {
    return DEFAULT_IMAGE_EXT;
  }
  return ext;
}

export function firstHttpsUrl(urlList) {
  if (!Array.isArray(urlList)) {
    return null;
  }

  for (const entry of urlList) {
    if (typeof entry !== 'string') {
      continue;
    }
    const trimmed = entry.trim();
    if (trimmed.toLowerCase().startsWith('https://')) {
      return trimmed;
    }
  }

  return null;
}

export function assertTikTokCdnUrl(imageUrl) {
  let parsed;
  try {
    parsed = new URL(imageUrl);
  } catch {
    throw new Error('image url is invalid');
  }

  if (parsed.protocol !== 'https:') {
    throw new Error('image url must be https');
  }

  if (parsed.username || parsed.password) {
    throw new Error('image url is invalid');
  }

  if (!isTikTokCdnHost(parsed.hostname)) {
    throw new Error('image url host is not a tiktok cdn');
  }

  return imageUrl;
}

export function pickImageUrl(image) {
  const fromImage = firstHttpsUrl(image?.imageURL?.urlList);
  const selected = fromImage || firstHttpsUrl(image?.displayImage?.urlList);
  if (!selected) {
    throw new Error('image url is missing');
  }
  return assertTikTokCdnUrl(selected);
}

function readItemStruct(data) {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const scope = data.__DEFAULT_SCOPE__ && typeof data.__DEFAULT_SCOPE__ === 'object'
    ? data.__DEFAULT_SCOPE__
    : data;
  return scope?.['webapp.video-detail']?.itemInfo?.itemStruct ?? null;
}

export function extractRehydrationData(html) {
  const pattern = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let match = pattern.exec(String(html || ''));

  while (match) {
    const attrs = match[1];
    const idMatch = /\bid\s*=\s*["']([^"']+)["']/i.exec(attrs);
    if (idMatch && idMatch[1] === REHYDRATION_SCRIPT_ID) {
      try {
        return JSON.parse(match[2].trim());
      } catch {
        throw new Error('rehydration json is invalid');
      }
    }
    match = pattern.exec(String(html || ''));
  }

  throw new Error('missing rehydration data');
}

export function parseTikTokUserPhotoImages(html, photoId) {
  const expectedId = String(photoId || '').trim();
  if (!expectedId) {
    throw new Error('missing photo id');
  }

  const itemStruct = readItemStruct(extractRehydrationData(html));
  const actualId = itemStruct?.id;
  if (actualId === undefined || actualId === null || String(actualId).trim() === '') {
    throw new Error('missing media id');
  }

  if (String(actualId) !== expectedId) {
    throw new Error(`expected ${expectedId} got ${actualId}`);
  }

  const images = itemStruct?.imagePost?.images;
  if (!Array.isArray(images) || images.length === 0) {
    throw new Error('imagePost.images is missing');
  }

  return images.map((image) => {
    const url = pickImageUrl(image);
    return {
      url,
      ext: extensionFromImageUrl(url),
    };
  });
}

function cookiesFilePath() {
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

export function parseNetscapeCookies(content) {
  const cookies = [];

  for (const line of String(content || '').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || (trimmed.startsWith('#') && !trimmed.startsWith(HTTPONLY_PREFIX))) {
      continue;
    }

    const raw = trimmed.startsWith(HTTPONLY_PREFIX)
      ? trimmed.slice(HTTPONLY_PREFIX.length)
      : trimmed;
    const parts = raw.split('\t');
    if (parts.length < 7) {
      continue;
    }

    const [domain, , cookiePath, secure, expires, name, ...valueParts] = parts;
    if (!COOKIE_NAME_PATTERN.test(name)) {
      continue;
    }

    const value = valueParts.join('\t');
    if (!value || /[\r\n;]/.test(value)) {
      continue;
    }

    cookies.push({
      domain: domain.toLowerCase(),
      path: cookiePath || '/',
      secure: String(secure).toUpperCase() === 'TRUE',
      expires: Number(expires),
      name,
      value,
    });
  }

  return cookies;
}

function domainMatches(cookieDomain, hostname) {
  const domain = String(cookieDomain || '').replace(/^\./, '').toLowerCase();
  const host = String(hostname || '').toLowerCase();
  if (!domain || !host) {
    return false;
  }
  return host === domain || host.endsWith(`.${domain}`);
}

function pathMatches(cookiePath, requestPath) {
  const prefix = cookiePath && cookiePath.startsWith('/') ? cookiePath : '/';
  const target = requestPath && requestPath.startsWith('/') ? requestPath : '/';
  if (prefix === '/') {
    return true;
  }
  return target === prefix || target.startsWith(prefix.endsWith('/') ? prefix : `${prefix}/`);
}

export function cookieHeaderForUrl(cookies, requestUrl, nowSeconds = Date.now() / 1000) {
  let parsed;
  try {
    parsed = new URL(requestUrl);
  } catch {
    return '';
  }

  const pairs = [];
  for (const cookie of cookies) {
    if (!cookie?.name || cookie.value === undefined || cookie.value === null) {
      continue;
    }
    if (cookie.secure && parsed.protocol !== 'https:') {
      continue;
    }
    if (Number.isFinite(cookie.expires) && cookie.expires > 0 && cookie.expires < nowSeconds) {
      continue;
    }
    if (!domainMatches(cookie.domain, parsed.hostname)) {
      continue;
    }
    if (!pathMatches(cookie.path, parsed.pathname)) {
      continue;
    }
    pairs.push(`${cookie.name}=${cookie.value}`);
  }

  return pairs.join('; ');
}

async function loadCookies() {
  const cookiesPath = cookiesFilePath();
  if (!cookiesPath) {
    return [];
  }

  const content = await fs.promises.readFile(cookiesPath, 'utf8');
  return parseNetscapeCookies(content);
}

function isPageHost(hostname) {
  return PAGE_HOSTS.has(String(hostname || '').toLowerCase());
}

async function fetchAllowed(initialUrl, {
  timeoutMs: timeout,
  headersFor,
  allowHost,
  failureLabel,
  requireHttps = false,
}) {
  let current = new URL(initialUrl);

  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    const httpsOk = current.protocol === 'https:';
    const httpOk = !requireHttps && current.protocol === 'http:';
    if ((!httpsOk && !httpOk) || !allowHost(current.hostname)) {
      throw new Error(`${failureLabel} host is not allowed`);
    }

    const headers = {
      'User-Agent': DESKTOP_USER_AGENT,
      ...headersFor(current),
    };
    const response = await fetch(current, {
      redirect: 'manual',
      signal: AbortSignal.timeout(timeout),
      headers,
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      await response.body?.cancel?.().catch(() => {});
      if (!location || hop === MAX_REDIRECTS) {
        throw new Error(`${failureLabel} redirected too many times`);
      }
      current = new URL(location, current);
      continue;
    }

    if (!response.ok) {
      await response.body?.cancel?.().catch(() => {});
      throw new Error(`${failureLabel} failed: ${response.status}`);
    }

    return response;
  }

  throw new Error(`${failureLabel} redirected too many times`);
}

export function detailPageUrlForPhoto(pageUrl) {
  let parsed;
  try {
    parsed = new URL(String(pageUrl || '').trim());
  } catch {
    throw new Error('photo page url is invalid');
  }

  const match = PHOTO_PATH.exec(parsed.pathname);
  if (match) {
    parsed.pathname = `/@${match[1]}/video/${match[2]}`;
  }
  parsed.hash = '';
  return parsed.toString();
}

function elementClassById(html, id) {
  const tagPattern = new RegExp(`<[a-z]+\\b[^>]*\\bid=["']${id}["'][^>]*>`, 'i');
  const tagMatch = tagPattern.exec(String(html || ''));
  if (!tagMatch) {
    return null;
  }

  const classMatch = /\bclass=["']([^"']*)["']/i.exec(tagMatch[0]);
  return classMatch ? classMatch[1] : null;
}

function isWafChallengePage(html) {
  return Boolean(elementClassById(html, 'cs') && elementClassById(html, 'wci'));
}

function decodeChallengePayload(encoded) {
  const padded = `${String(encoded || '')}===`;
  try {
    return JSON.parse(Buffer.from(padded, 'base64').toString('utf8'));
  } catch {
    throw new Error('Unable to extract challenge data');
  }
}

function solveWafChallenge(html) {
  const encoded = elementClassById(html, 'cs');
  const cookieName = elementClassById(html, 'wci');
  if (!encoded || !cookieName) {
    throw new Error('Unable to extract challenge data');
  }

  const challengeData = decodeChallengePayload(encoded);
  const expectedDigest = Buffer.from(String(challengeData?.v?.c || ''), 'base64');
  const baseInput = Buffer.from(String(challengeData?.v?.a || ''), 'base64');
  if (!expectedDigest.length || !baseInput.length) {
    throw new Error('Unable to extract challenge data');
  }

  let solved = false;
  for (let nonce = 0; nonce <= CHALLENGE_MAX_NONCE; nonce += 1) {
    const digest = createHash('sha256')
      .update(baseInput)
      .update(String(nonce))
      .digest();
    if (digest.equals(expectedDigest)) {
      challengeData.d = Buffer.from(String(nonce), 'utf8').toString('base64');
      solved = true;
      break;
    }
  }

  if (!solved) {
    throw new Error('Unable to solve JS challenge');
  }

  const cookies = [{
    domain: '.tiktok.com',
    path: '/',
    secure: true,
    expires: 0,
    name: cookieName,
    value: Buffer.from(JSON.stringify(challengeData), 'utf8').toString('base64'),
  }];

  const rciName = elementClassById(html, 'rci');
  const rciValue = elementClassById(html, 'rs');
  if (rciName && rciValue) {
    cookies.push({
      domain: '.tiktok.com',
      path: '/',
      secure: true,
      expires: 0,
      name: rciName,
      value: rciValue,
    });
  }

  return cookies;
}

async function fetchPhotoPageHtmlOnce(pageUrl, cookies) {
  const response = await fetchAllowed(pageUrl, {
    timeoutMs: pageTimeoutMs(),
    allowHost: isPageHost,
    failureLabel: 'photo page',
    headersFor(url) {
      const headers = {
        Accept: 'text/html,application/xhtml+xml',
      };
      const cookie = cookieHeaderForUrl(cookies, url);
      if (cookie) {
        headers.Cookie = cookie;
      }
      return headers;
    },
  });

  return response.text();
}

export async function fetchTikTokPhotoHtml(pageUrl) {
  const detailUrl = detailPageUrlForPhoto(pageUrl);
  const cookies = await loadCookies();
  let html = await fetchPhotoPageHtmlOnce(detailUrl, cookies);

  if (isWafChallengePage(html)) {
    const challengeCookies = solveWafChallenge(html);
    html = await fetchPhotoPageHtmlOnce(detailUrl, [...cookies, ...challengeCookies]);
  }

  if (isWafChallengePage(html)) {
    throw new Error('photo page challenge retry failed');
  }

  return html;
}

async function removeFileIfPresent(filePath) {
  try {
    await fs.promises.unlink(filePath);
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      throw error;
    }
  }
}

export async function downloadCdnImage(imageUrl, filePath, pageUrl) {
  assertTikTokCdnUrl(imageUrl);
  const cookies = await loadCookies();
  const response = await fetchAllowed(imageUrl, {
    timeoutMs: imageTimeoutMs(),
    allowHost: isTikTokCdnHost,
    failureLabel: 'image download',
    requireHttps: true,
    headersFor(url) {
      const headers = {
        Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        Referer: pageUrl,
      };
      const cookie = cookieHeaderForUrl(cookies, url);
      if (cookie) {
        headers.Cookie = cookie;
      }
      return headers;
    },
  });

  const contentType = (response.headers.get('content-type') || '').toLowerCase();
  if (contentType.includes('text/html') || contentType.includes('application/json')) {
    await response.body?.cancel?.().catch(() => {});
    throw new Error('image download returned an unexpected content type');
  }

  if (!response.body) {
    throw new Error('image download was empty');
  }

  try {
    await pipeline(Readable.fromWeb(response.body), fs.createWriteStream(filePath, { flags: 'wx' }));
  } catch (error) {
    await removeFileIfPresent(filePath);
    throw error;
  }

  const stats = await fs.promises.stat(filePath);
  if (!stats.isFile() || stats.size < 1) {
    await removeFileIfPresent(filePath);
    throw new Error('image file is empty');
  }
}

export function diskFileNameForPhoto(stem, index, ext, imageCount) {
  const safeExt = String(ext || DEFAULT_IMAGE_EXT).replace(/^\./, '') || DEFAULT_IMAGE_EXT;
  if (imageCount === 1) {
    return `${stem}.${safeExt}`;
  }
  return `${stem}_${index}.${safeExt}`;
}

export default {
  isTikTokCdnHost,
  extensionFromImageUrl,
  firstHttpsUrl,
  assertTikTokCdnUrl,
  pickImageUrl,
  extractRehydrationData,
  parseTikTokUserPhotoImages,
  parseNetscapeCookies,
  cookieHeaderForUrl,
  detailPageUrlForPhoto,
  fetchTikTokPhotoHtml,
  downloadCdnImage,
  diskFileNameForPhoto,
};
