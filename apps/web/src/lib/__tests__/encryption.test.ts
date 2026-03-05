import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { encrypt, decrypt, isEncrypted } from '../encryption';
import { BadRequestError } from '../errors';

describe('encryption', () => {
  const originalEnv = process.env.COHORTIX_ENCRYPTION_KEY;

  beforeEach(() => {
    // Set a valid 32-byte (256-bit) key in hex format
    process.env.COHORTIX_ENCRYPTION_KEY =
      '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  });

  afterEach(() => {
    process.env.COHORTIX_ENCRYPTION_KEY = originalEnv;
  });

  describe('encrypt/decrypt round-trip', () => {
    it('should encrypt and decrypt a simple string', () => {
      const plaintext = 'hello world';
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
      expect(encrypted).not.toBe(plaintext);
    });

    it('should encrypt and decrypt a complex string', () => {
      const plaintext = 'Bearer sk_live_xyz123!@#$%^&*()_+-=[]{}|;:,.<>?';
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should produce different ciphertexts for the same plaintext', () => {
      const plaintext = 'test';
      const encrypted1 = encrypt(plaintext);
      const encrypted2 = encrypt(plaintext);

      expect(encrypted1).not.toBe(encrypted2); // Different IVs
      expect(decrypt(encrypted1)).toBe(plaintext);
      expect(decrypt(encrypted2)).toBe(plaintext);
    });

    it('should handle empty strings', () => {
      const plaintext = '';
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe('');
    });

    it('should handle unicode characters', () => {
      const plaintext = 'Hello 世界 🌍 émojis!';
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });
  });

  describe('invalid format handling', () => {
    it('should throw on invalid format (missing parts)', () => {
      expect(() => decrypt('invalid:format')).toThrow(BadRequestError);
      expect(() => decrypt('invalid:format')).toThrow('Invalid encrypted token format');
    });

    it('should throw on invalid format (wrong number of parts)', () => {
      expect(() => decrypt('v1:iv:tag')).toThrow(BadRequestError);
    });

    it('should throw on unsupported version', () => {
      const validFormat = 'v2:aGVsbG8=:dGFn:ZW5jcnlwdGVk';
      expect(() => decrypt(validFormat)).toThrow(BadRequestError);
      expect(() => decrypt(validFormat)).toThrow('Unsupported encryption version: v2');
    });

    it('should throw on corrupted ciphertext', () => {
      const plaintext = 'test';
      const encrypted = encrypt(plaintext);

      // Corrupt the encrypted part
      const parts = encrypted.split(':');
      parts[3] = 'corrupted';
      const corrupted = parts.join(':');

      expect(() => decrypt(corrupted)).toThrow();
    });

    it('should throw on tampered auth tag', () => {
      const plaintext = 'test';
      const encrypted = encrypt(plaintext);

      // Tamper with the auth tag
      const parts = encrypted.split(':');
      parts[2] = Buffer.from('tampered12345678').toString('base64'); // Must be 16 bytes
      const tampered = parts.join(':');

      expect(() => decrypt(tampered)).toThrow();
    });
  });

  describe('missing encryption key error', () => {
    it('should throw when COHORTIX_ENCRYPTION_KEY is not set (encrypt)', () => {
      delete process.env.COHORTIX_ENCRYPTION_KEY;

      expect(() => encrypt('test')).toThrow(BadRequestError);
      expect(() => encrypt('test')).toThrow('COHORTIX_ENCRYPTION_KEY is not configured');
    });

    it('should throw when COHORTIX_ENCRYPTION_KEY is not set (decrypt)', () => {
      const encrypted = 'v1:aGVsbG8=:dGFnMTIzNDU2Nzg5MDEyMzQ1Ng==:ZW5jcnlwdGVk';
      delete process.env.COHORTIX_ENCRYPTION_KEY;

      expect(() => decrypt(encrypted)).toThrow(BadRequestError);
      expect(() => decrypt(encrypted)).toThrow('COHORTIX_ENCRYPTION_KEY is not configured');
    });
  });

  describe('auth tag length validation', () => {
    it('should throw on invalid auth tag length (too short)', () => {
      const encrypted = 'v1:aGVsbG8=:c2hvcnQ=:ZW5jcnlwdGVk'; // "short" in base64
      expect(() => decrypt(encrypted)).toThrow(BadRequestError);
      expect(() => decrypt(encrypted)).toThrow(/Invalid authentication tag length/);
    });

    it('should throw on invalid auth tag length (too long)', () => {
      const longTag = Buffer.from('12345678901234567890').toString('base64'); // 20 bytes
      const encrypted = `v1:aGVsbG8=:${longTag}:ZW5jcnlwdGVk`;

      expect(() => decrypt(encrypted)).toThrow(BadRequestError);
      expect(() => decrypt(encrypted)).toThrow(/Invalid authentication tag length/);
    });

    it('should accept exactly 16-byte auth tag', () => {
      const plaintext = 'valid';
      const encrypted = encrypt(plaintext);

      // Extract parts and verify tag is 16 bytes
      const parts = encrypted.split(':');
      const tag = Buffer.from(parts[2]!, 'base64');
      expect(tag.length).toBe(16);

      // Decryption should succeed
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });
  });

  describe('isEncrypted', () => {
    it('should return true for encrypted values', () => {
      const encrypted = encrypt('test');
      expect(isEncrypted(encrypted)).toBe(true);
    });

    it('should return false for plaintext values', () => {
      expect(isEncrypted('plaintext')).toBe(false);
      expect(isEncrypted('Bearer token123')).toBe(false);
      expect(isEncrypted('')).toBe(false);
    });

    it('should return true for values starting with v1:', () => {
      expect(isEncrypted('v1:anything')).toBe(true);
    });
  });
});
