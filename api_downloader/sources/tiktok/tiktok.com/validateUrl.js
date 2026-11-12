const ALLOWED_HOSTS = new Set(['tiktok.com', 'www.tiktok.com']);

export function validateTikTokComUrl(raw) {
  if (typeof raw !== 'string' || !raw.trim()) {
    return { ok: false, error: 'url is required' };
  }

  let parsed;
  try {
    parsed = new URL(raw.trim());
  } catch {
    return { ok: false, error: 'url is invalid' };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { ok: false, error: 'url must be http or https' };
  }

  const hostname = parsed.hostname.toLowerCase();
  if (!ALLOWED_HOSTS.has(hostname)) {
    return { ok: false, error: 'url host must be tiktok.com or www.tiktok.com' };
  }

  parsed.hash = '';
  return { ok: true, url: parsed.toString() };
}

export default {
  validateTikTokComUrl,
};
