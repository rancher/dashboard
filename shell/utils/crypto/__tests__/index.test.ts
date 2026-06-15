import { base64Encode, base64DecodeToBuffer, base64Decode, binarySize } from '../index';

describe('crypto/index', () => {
  describe('base64Encode', () => {
    it.each([
      {
        desc:     'null input',
        input:    null as any,
        expected: null,
      },
      {
        desc:     'undefined input',
        input:    undefined as any,
        expected: undefined,
      },
      {
        desc:     'empty string',
        input:    '',
        expected: '',
      },
      {
        desc:     'hello',
        input:    'hello',
        expected: 'aGVsbG8=',
      },
      {
        desc:     'abc (no padding needed)',
        input:    'abc',
        expected: 'YWJj',
      },
    ])('returns correct base64 for $desc', ({ input, expected }) => {
      expect(base64Encode(input)).toStrictEqual(expected);
    });

    it.each([
      {
        desc:     'single-byte input (strips two padding chars)',
        input:    'a',
        expected: 'YQ',
      },
      {
        desc:     'two-byte input (strips one padding char)',
        input:    'ab',
        expected: 'YWI',
      },
      {
        desc:     'three-byte input (no padding to strip)',
        input:    'abc',
        expected: 'YWJj',
      },
    ])('url alphabet: $desc', ({ input, expected }) => {
      expect(base64Encode(input, 'url')).toStrictEqual(expected);
    });
  });

  describe('base64DecodeToBuffer', () => {
    it.each([
      {
        desc:     'null',
        input:    null as any,
        expected: null,
      },
      {
        desc:     'undefined',
        input:    undefined as any,
        expected: undefined,
      },
    ])('returns $desc unchanged', ({ input, expected }) => {
      expect(base64DecodeToBuffer(input)).toStrictEqual(expected);
    });

    it('decodes a valid base64 string to a buffer', () => {
      const result = base64DecodeToBuffer('aGVsbG8=');

      expect(result.toString()).toStrictEqual('hello');
    });

    it('decodes base64 without padding', () => {
      const result = base64DecodeToBuffer('YWJj');

      expect(result.toString()).toStrictEqual('abc');
    });
  });

  describe('base64Decode', () => {
    it.each([
      {
        desc:     'null',
        input:    null as any,
        expected: null,
      },
      {
        desc:     'empty string',
        input:    '',
        expected: '',
      },
      {
        desc:     'padded base64 for hello',
        input:    'aGVsbG8=',
        expected: 'hello',
      },
      {
        desc:     'unpadded base64 for abc',
        input:    'YWJj',
        expected: 'abc',
      },
    ])('$desc', ({ input, expected }) => {
      expect(base64Decode(input)).toStrictEqual(expected);
    });

    it('decodes url-safe base64 without padding (url-encoded "a")', () => {
      // base64Encode('a', 'url') → 'YQ' (stripped ==)
      // base64Decode must handle missing padding
      expect(base64Decode('YQ')).toStrictEqual('a');
    });
  });

  describe('binarySize', () => {
    it.each([
      {
        desc:     'empty string',
        input:    '',
        expected: 0,
      },
      {
        desc:     'no padding (3 bytes — "abc")',
        input:    'YWJj',
        expected: 3,
      },
      {
        desc:     'one padding char (2 bytes — "ab")',
        input:    'YWI=',
        expected: 2,
      },
      {
        desc:     'two padding chars (1 byte — "a")',
        input:    'YQ==',
        expected: 1,
      },
    ])('$desc → $expected bytes', ({ input, expected }) => {
      expect(binarySize(input)).toStrictEqual(expected);
    });
  });
});
