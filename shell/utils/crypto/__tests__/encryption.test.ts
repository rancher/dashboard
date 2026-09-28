import { webcrypto } from 'crypto';

import {
  deriveKey,
  encrypt,
  decrypt,
  type EncryptedString,
} from '@shell/utils/crypto/encryption';

// jsdom does not expose the Web Crypto API; polyfill it from Node's built-in
beforeAll(() => {
  if (!globalThis.crypto?.subtle) {
    Object.defineProperty(globalThis, 'crypto', {
      value:        webcrypto,
      writable:     false,
      configurable: true,
    });
  }
});

describe('utils/crypto/encryption', () => {
  describe('deriveKey', () => {
    it('returns a CryptoKey', async() => {
      const key = await deriveKey('password');

      expect(key).toBeDefined();
      expect(key.type).toStrictEqual('secret');
    });

    it('produces the same key for the same password', async() => {
      // Two keys derived from the same password must produce the same ciphertext
      const password = 'consistent-password';
      const key1 = await deriveKey(password);
      const key2 = await deriveKey(password);
      const content = 'same content';

      const enc = await encrypt(content, key1);
      const dec = await decrypt(enc, key2);

      expect(dec).toStrictEqual(content);
    });

    it('produces distinct keys for different passwords', async() => {
      const key1 = await deriveKey('password-a');
      const key2 = await deriveKey('password-b');

      const enc = await encrypt('data', key1);

      await expect(decrypt(enc, key2)).rejects.toBeDefined();
    });

    it('handles an empty string password', async() => {
      const key = await deriveKey('');

      expect(key.type).toStrictEqual('secret');
    });
  });

  describe('encrypt', () => {
    it('returns an object with cipher and iv fields', async() => {
      const key = await deriveKey('password');
      const result = await encrypt('hello', key);

      expect(result).toHaveProperty('cipher');
      expect(result).toHaveProperty('iv');
      expect(typeof result.cipher).toStrictEqual('string');
      expect(typeof result.iv).toStrictEqual('string');
    });

    it('produces base64-encoded cipher and iv', async() => {
      const key = await deriveKey('password');
      const { cipher, iv } = await encrypt('hello', key);
      const base64Re = /^[A-Za-z0-9+/]+=*$/;

      expect(cipher).toMatch(base64Re);
      expect(iv).toMatch(base64Re);
    });

    it('produces a different ciphertext for the same plaintext each time (random iv)', async() => {
      const key = await deriveKey('password');
      const { cipher: c1, iv: iv1 } = await encrypt('hello', key);
      const { cipher: c2, iv: iv2 } = await encrypt('hello', key);

      // IVs are random per-call, so ciphertexts should differ
      expect(iv1).not.toStrictEqual(iv2);
      expect(c1).not.toStrictEqual(c2);
    });

    it('encrypts an empty string', async() => {
      const key = await deriveKey('password');
      const result = await encrypt('', key);

      expect(typeof result.cipher).toStrictEqual('string');
      expect(typeof result.iv).toStrictEqual('string');
    });

    it('encrypts a long string', async() => {
      const key = await deriveKey('password');
      const long = 'x'.repeat(10_000);
      const { cipher, iv } = await encrypt(long, key);
      const decrypted = await decrypt({ cipher, iv }, key);

      expect(decrypted).toStrictEqual(long);
    });
  });

  describe('decrypt', () => {
    it('round-trips a simple string', async() => {
      const key = await deriveKey('secret');
      const plaintext = 'Hello, World!';
      const enc = await encrypt(plaintext, key);

      expect(await decrypt(enc, key)).toStrictEqual(plaintext);
    });

    it('round-trips unicode characters', async() => {
      const key = await deriveKey('unicode-key');
      const plaintext = '日本語テスト 🔑 émojî';
      const enc = await encrypt(plaintext, key);

      expect(await decrypt(enc, key)).toStrictEqual(plaintext);
    });

    it('round-trips an empty string', async() => {
      const key = await deriveKey('empty-key');
      const enc = await encrypt('', key);

      expect(await decrypt(enc, key)).toStrictEqual('');
    });

    it('fails when iv is tampered with', async() => {
      const key = await deriveKey('tamper-test');
      const enc = await encrypt('sensitive', key);

      // Flip the last character of the iv
      const badIv: EncryptedString = {
        ...enc,
        iv: enc.iv.slice(0, -1) + (enc.iv.endsWith('A') ? 'B' : 'A'),
      };

      await expect(decrypt(badIv, key)).rejects.toBeDefined();
    });

    it('fails when cipher is tampered with', async() => {
      const key = await deriveKey('tamper-cipher');
      const enc = await encrypt('sensitive', key);

      const badCipher: EncryptedString = {
        ...enc,
        cipher: enc.cipher.slice(0, -1) + (enc.cipher.endsWith('A') ? 'B' : 'A'),
      };

      await expect(decrypt(badCipher, key)).rejects.toBeDefined();
    });
  });
});
