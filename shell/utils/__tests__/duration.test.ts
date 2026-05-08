import { toMilliseconds, toSeconds } from '@shell/utils/duration';

describe('toMilliseconds', () => {
  describe('falsy input', () => {
    it.each([
      [null, 0],
      [undefined, 0],
      ['', 0],
      [0, 0],
    ] as [unknown, number][])('returns 0 for %p', (input, expected) => {
      expect(toMilliseconds(input as string)).toStrictEqual(expected);
    });
  });

  describe('non-matching input', () => {
    it('returns 0 for a plain word', () => {
      expect(toMilliseconds('invalid')).toStrictEqual(0);
    });

    it('returns 0 for a number with no unit', () => {
      expect(toMilliseconds('42')).toStrictEqual(0);
    });
  });

  describe('single-unit inputs', () => {
    it.each([
      ['1ms', 1],
      ['1s', 1_000],
      ['1m', 60_000],
      ['1h', 3_600_000],
      ['1d', 86_400_000],
      ['1w', 604_800_000],
      ['1y', 31_536_000_000],
    ])('converts %s correctly', (input, expected) => {
      expect(toMilliseconds(input)).toStrictEqual(expected);
    });
  });

  describe('multiple-unit inputs', () => {
    it('combines years and days', () => {
      // 1y + 2d
      expect(toMilliseconds('1y2d')).toStrictEqual(31_536_000_000 + 2 * 86_400_000);
    });

    it('combines hours, minutes and seconds', () => {
      // 1h30m15s
      expect(toMilliseconds('1h30m15s')).toStrictEqual(
        3_600_000 + 30 * 60_000 + 15_000
      );
    });

    it('combines all units', () => {
      const expected =
        1 * 31_536_000_000 + // y
        1 * 604_800_000 + // w
        1 * 86_400_000 + // d
        1 * 3_600_000 + // h
        1 * 60_000 + // m
        1 * 1_000 + // s
        1; // ms

      expect(toMilliseconds('1y1w1d1h1m1s1ms')).toStrictEqual(expected);
    });
  });

  describe('multi-digit numbers', () => {
    it('handles multi-digit number of weeks', () => {
      expect(toMilliseconds('52w')).toStrictEqual(52 * 604_800_000);
    });

    it('handles multi-digit milliseconds', () => {
      expect(toMilliseconds('500ms')).toStrictEqual(500);
    });
  });

  describe('numeric string input', () => {
    it('accepts a numeric 0 as string-coerced value', () => {
      // "0" string matches the regex with all groups undefined → returns 0
      expect(toMilliseconds('0')).toStrictEqual(0);
    });
  });
});

describe('toSeconds', () => {
  it('returns 0 for empty string', () => {
    expect(toSeconds('')).toStrictEqual(0);
  });

  it('converts milliseconds to seconds (floors toward zero)', () => {
    expect(toSeconds('30s')).toStrictEqual(30);
  });

  it('floors sub-second inputs to 0', () => {
    expect(toSeconds('500ms')).toStrictEqual(0);
  });

  it('floors mixed sub-second remainder', () => {
    // 1m30s500ms = 90500ms → floor(90500/1000) = 90
    expect(toSeconds('1m30s500ms')).toStrictEqual(90);
  });

  it('handles hours correctly', () => {
    expect(toSeconds('2h')).toStrictEqual(7_200);
  });
});
