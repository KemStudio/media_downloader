import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const SCRYPT_KEYLEN = 64;
const SALT_BYTES = 16;
const TOKEN_BYTES = 32;
const TOKEN_PREFIX_LENGTH = 10;
const TOKEN_PREFIX_MARKER = 'md_';

export function generateTokenSecret() {
  return `${TOKEN_PREFIX_MARKER}${randomBytes(TOKEN_BYTES).toString('base64url')}`;
}

export function tokenPrefixFromSecret(token) {
  return String(token).slice(0, TOKEN_PREFIX_LENGTH);
}

export function hashToken(token) {
  const salt = randomBytes(SALT_BYTES).toString('hex');
  const hash = scryptSync(token, salt, SCRYPT_KEYLEN).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyToken(token, tokenHash) {
  const [salt, storedHash] = tokenHash.split(':');
  if (!salt || !storedHash) {
    return false;
  }

  const hash = scryptSync(token, salt, SCRYPT_KEYLEN);
  const stored = Buffer.from(storedHash, 'hex');

  if (hash.length !== stored.length) {
    return false;
  }

  return timingSafeEqual(hash, stored);
}
