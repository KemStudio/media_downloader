import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const SCRYPT_KEYLEN = 64;
const SALT_BYTES = 16;

export function hashPassword(password) {
  const salt = randomBytes(SALT_BYTES).toString('hex');
  const hash = scryptSync(password, salt, SCRYPT_KEYLEN).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password, passwordHash) {
  const [salt, storedHash] = passwordHash.split(':');
  if (!salt || !storedHash) {
    return false;
  }

  const hash = scryptSync(password, salt, SCRYPT_KEYLEN);
  const stored = Buffer.from(storedHash, 'hex');

  if (hash.length !== stored.length) {
    return false;
  }

  return timingSafeEqual(hash, stored);
}
