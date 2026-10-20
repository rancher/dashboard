import { Buffer } from 'buffer';
import { md5, sha256 } from '../index';

describe('crypto/index hashing (md5/sha256)', () => {
  describe('md5', () => {
    it.each([
      {
        desc:     'empty string',
        input:    '',
        expected: 'd41d8cd98f00b204e9800998ecf8427e',
      },
      {
        desc:     'abc',
        input:    'abc',
        expected: '900150983cd24fb0d6963f7d28e17f72',
      },
      {
        desc:     'longer message (exercises multi-block padding)',
        input:    'The quick brown fox jumps over the lazy dog',
        expected: '9e107d9d372bb6826bd81d3542a419d6',
      },
    ])('returns correct hex digest for $desc', ({ input, expected }) => {
      expect(md5(input, 'hex')).toStrictEqual(expected);
    });

    it('accepts a Buffer as input and matches the string-input digest', () => {
      expect(md5(Buffer.from('abc'), 'hex')).toStrictEqual(md5('abc', 'hex'));
    });

    it('accepts a Uint8Array as input and matches the string-input digest', () => {
      expect(md5(new Uint8Array(Buffer.from('abc')), 'hex')).toStrictEqual(md5('abc', 'hex'));
    });

    it('defaults to a binary-encoded string digest when no encoding is given', () => {
      const result = md5('abc') as string;

      expect(typeof result).toStrictEqual('string');
      expect(Buffer.from(result, 'binary').toString('hex')).toStrictEqual('900150983cd24fb0d6963f7d28e17f72');
    });

    it('invokes the callback with the digest and also returns it', () => {
      const callback = jest.fn();
      const result = md5('abc', 'hex', callback);

      expect(callback).toHaveBeenCalledWith(null, '900150983cd24fb0d6963f7d28e17f72');
      expect(result).toStrictEqual('900150983cd24fb0d6963f7d28e17f72');
    });
  });

  describe('sha256', () => {
    it.each([
      {
        desc:     'empty string',
        input:    '',
        expected: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      },
      {
        desc:     'abc',
        input:    'abc',
        expected: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
      },
      {
        desc:     'longer message (exercises multi-block padding)',
        input:    'The quick brown fox jumps over the lazy dog',
        expected: 'd7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592',
      },
    ])('returns correct hex digest for $desc', ({ input, expected }) => {
      expect(sha256(input, 'hex')).toStrictEqual(expected);
    });

    it('accepts a Buffer as input and matches the string-input digest', () => {
      expect(sha256(Buffer.from('abc'), 'hex')).toStrictEqual(sha256('abc', 'hex'));
    });

    it('defaults to a binary-encoded string digest when no encoding is given', () => {
      const result = sha256('abc') as string;

      expect(typeof result).toStrictEqual('string');
      expect(Buffer.from(result, 'binary').toString('hex')).toStrictEqual('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    });

    it('invokes the callback with the digest and also returns it', () => {
      const callback = jest.fn();
      const result = sha256('abc', 'hex', callback);

      expect(callback).toHaveBeenCalledWith(null, 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
      expect(result).toStrictEqual('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    });
  });
});
