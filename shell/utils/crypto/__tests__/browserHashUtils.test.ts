import { hashObj, isEmptyData, convertToBuffer } from '../browserHashUtils';

describe('crypto/browserHashUtils', () => {
  describe('hashObj', () => {
    it.each([
      {
        desc:     'empty object',
        input:    {},
        expected: '31e',
      },
      {
        desc:     'object with string value',
        input:    { a: 1 },
        expected: '1b0fmfe',
      },
    ])('returns deterministic base-36 hash for $desc', ({ input, expected }) => {
      expect(hashObj(input)).toStrictEqual(expected);
    });

    it('is idempotent — same input always produces same hash', () => {
      const obj = {
        a: 1, b: 'hello', c: [1, 2, 3]
      };

      expect(hashObj(obj)).toStrictEqual(hashObj(obj));
    });

    it('produces different hashes for different objects', () => {
      expect(hashObj({ a: 1 })).not.toStrictEqual(hashObj({ b: 1 }));
    });

    it('returns a base-36 string (only digits and lowercase a-z)', () => {
      expect(hashObj({ key: 'value' })).toMatch(/^[0-9a-z]+$/);
    });
  });

  describe('isEmptyData', () => {
    it.each([
      {
        desc:     'empty string',
        input:    '',
        expected: true,
      },
      {
        desc:     'non-empty string',
        input:    'hello',
        expected: false,
      },
      {
        desc:     'zero-length ArrayBuffer',
        input:    new ArrayBuffer(0),
        expected: true,
      },
      {
        desc:     'non-empty ArrayBuffer',
        input:    new ArrayBuffer(5),
        expected: false,
      },
      {
        desc:     'zero-length Uint8Array',
        input:    new Uint8Array(0),
        expected: true,
      },
      {
        desc:     'non-empty Uint8Array',
        input:    new Uint8Array([1, 2, 3]),
        expected: false,
      },
    ])('$desc → $expected', ({ input, expected }) => {
      expect(isEmptyData(input)).toStrictEqual(expected);
    });
  });

  describe('convertToBuffer', () => {
    it('converts a string to a Uint8Array with the correct byte values', () => {
      const result = convertToBuffer('hello');

      expect(result).toBeInstanceOf(Uint8Array);
      expect(Array.from(result)).toStrictEqual([104, 101, 108, 108, 111]);
    });

    it('converts a Uint8Array view to a Uint8Array with the same bytes', () => {
      const input = new Uint8Array([1, 2, 3]);
      const result = convertToBuffer(input);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(Array.from(result)).toStrictEqual([1, 2, 3]);
    });

    it('wraps a plain ArrayBuffer in a Uint8Array', () => {
      const buf = new Uint8Array([10, 20, 30]).buffer;
      const result = convertToBuffer(buf);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(Array.from(result)).toStrictEqual([10, 20, 30]);
    });
  });
});
