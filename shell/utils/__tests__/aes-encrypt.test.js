
import AESEncrypt from '@shell/utils/aes-encrypt.js';
import Crypto from 'crypto-js';

describe('fx: AESEncrypt', () => {
  it('should return raw message', () => {
    const result = AESEncrypt('', '');

    expect(result).toBe('');
  });
  it('should encrypt message', () => {
    const secret = 'secret 123';
    const message = 'message';
    const result = AESEncrypt(message, secret);
    const m = Crypto.AES.decrypt(result, secret).toString(Crypto.enc.Utf8);

    expect(m).toBe(message);
  });
});
