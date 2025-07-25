/**
 * Helpers for string encryption and decryption
 */

// We just use a static salt
const SALT = new TextEncoder().encode('rancher-dashboard');

/**
 * Type for the result of encryption
 */
export type EncryptedString = {
  cipher: string;
  iv: string;
};

/**
 * Generate an encryption key from a password
 *
 * @param password Password to use for the key
 * @returns Encryption key
 */
export async function deriveKey(password: string): Promise<CryptoKey> {
  const passwordBytes = stringToBytes(password);

  const initialKey = await crypto.subtle.importKey(
    'raw',
    passwordBytes,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return await crypto.subtle.deriveKey(
    {
      name:       'PBKDF2',
      salt:       SALT,
      iterations: 100000,
      hash:       'SHA-256'
    },
    initialKey,
    {
      name:   'AES-GCM',
      length: 256
    },
    false,
    [
      'encrypt',
      'decrypt'
    ]
  );
}

/**
 * Encrypt data
 *
 * @param content String to be encrypted
 * @param key Encryption key
 * @returns Encrypted data
 */
export async function encrypt(content: string, key: CryptoKey): Promise<EncryptedString> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const contentBytes = stringToBytes(content);
  const cipher = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, contentBytes)
  );

  return {
    iv:     bytesToBase64(iv),
    cipher: bytesToBase64(cipher),
  };
}

/**
 * Decrypt encrypted data
 * @param encryptedData Encrypted data with `cipher` and `iv` field
 * @param key Key to use for decryption
 * @returns Decrypted value as a string
 */
export async function decrypt(encryptedData: EncryptedString, key: CryptoKey): Promise<string> {
  const iv = base64ToBytes(encryptedData.iv);
  const cipher = base64ToBytes(encryptedData.cipher);
  const contentBytes = new Uint8Array(
    await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher)
  );

  return bytesToString(contentBytes);
}

function bytesToString(bytes: any): string {
  return new TextDecoder().decode(bytes);
}

function stringToBytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

function bytesToBase64(arr: Uint8Array) {
  return btoa(Array.from(arr, (b: number) => String.fromCharCode(b)).join(''));
}

function base64ToBytes(base64: string): Uint8Array {
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}
