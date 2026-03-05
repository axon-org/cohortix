/**
 * Token Encryption Utilities
 *
 * AES-256-GCM encryption for sensitive tokens (auth tokens, API keys)
 * Uses COHORTIX_ENCRYPTION_KEY from environment
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { BadRequestError } from './errors';

const ENCRYPTION_VERSION = 'v1';

function getEncryptionKey(): Buffer {
  const rawKey = process.env.COHORTIX_ENCRYPTION_KEY;
  if (!rawKey) {
    throw new BadRequestError('COHORTIX_ENCRYPTION_KEY is not configured');
  }
  return Buffer.from(rawKey, 'hex');
}

/**
 * Encrypt a plaintext value using AES-256-GCM
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);

  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${ENCRYPTION_VERSION}:${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
}

/**
 * Decrypt an encrypted value
 */
export function decrypt(ciphertext: string): string {
  const parts = ciphertext.split(':');
  if (parts.length !== 4) {
    throw new BadRequestError('Invalid encrypted token format');
  }

  const [version, ivB64, tagB64, encryptedB64] = parts;
  if (version !== ENCRYPTION_VERSION) {
    throw new BadRequestError(`Unsupported encryption version: ${version}`);
  }

  const key = getEncryptionKey();
  const iv = Buffer.from(ivB64!, 'base64');
  const tag = Buffer.from(tagB64!, 'base64');
  const encrypted = Buffer.from(encryptedB64!, 'base64');

  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}

/**
 * Check if a value appears to be encrypted (has the version prefix)
 */
export function isEncrypted(value: string): boolean {
  return value.startsWith(`${ENCRYPTION_VERSION}:`);
}
