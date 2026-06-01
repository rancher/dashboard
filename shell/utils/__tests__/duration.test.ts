import { toMilliseconds, toSeconds } from '@shell/utils/duration';

describe('toMilliseconds', () => {
  describe('falsy input', () => {
    it.each([
      { desc: 'null', input: null },
      { desc: 'undefined', input: undefined },
      { desc: 'empty string', input: '' },
      { desc: 'zero', input: 0 },
    ])('returns 0 for $desc', ({ input }) => {
      expect(toMilliseconds(input as any)).toStrictEqual(0);
    });
  });

  describe('non-matching input', () => {
    it.each([
      { desc: 'a plain word', input: 'invalid' },
      { desc: 'a number with no unit', input: '42' },
    ])('returns 0 for $desc', ({ input }) => {
      expect(toMilliseconds(input)).toStrictEqual(0);
    });
  });

  describe('single-unit inputs', () => {
    it.each([
      {
        desc:     '1ms → 1',
        input:    '1ms',
        expected: 1,
      },
      {
        desc:     '1s → 1000',
        input:    '1s',
        expected: 1_000,
      },
      {
        desc:     '1m → 60000',
        input:    '1m',
        expected: 60_000,
      },
      {
        desc:     '1h → 3600000',
        input:    '1h',
        expected: 3_600_000,
      },
      {
        desc:     '1d → 86400000',
        input:    '1d',
        expected: 86_400_000,
      },
      {
        desc:     '1w → 604800000',
        input:    '1w',
        expected: 604_800_000,
      },
      {
        desc:     '1y → 31536000000',
        input:    '1y',
        expected: 31_536_000_000,
      },
    ])('$desc', ({ input, expected }) => {
      expect(toMilliseconds(input)).toStrictEqual(expected);
    });
  });

  describe('multiple-unit inputs', () => {
    it.each([
      {
        desc:     'combines years and days (1y2d)',
        input:    '1y2d',
        expected: 31_536_000_000 + 2 * 86_400_000,
      },
      {
        desc:     'combines hours, minutes and seconds (1h30m15s)',
        input:    '1h30m15s',
        expected: 3_600_000 + 30 * 60_000 + 15_000,
      },
      {
        desc:     'combines all units (1y1w1d1h1m1s1ms)',
        input:    '1y1w1d1h1m1s1ms',
        expected: 31_536_000_000 + 604_800_000 + 86_400_000 + 3_600_000 + 60_000 + 1_000 + 1,
      },
    ])('$desc', ({ input, expected }) => {
      expect(toMilliseconds(input)).toStrictEqual(expected);
    });
  });

  describe('multi-digit numbers', () => {
    it.each([
      {
        desc:     'handles 52 weeks',
        input:    '52w',
        expected: 52 * 604_800_000,
      },
      {
        desc:     'handles 500 milliseconds',
        input:    '500ms',
        expected: 500,
      },
    ])('$desc', ({ input, expected }) => {
      expect(toMilliseconds(input)).toStrictEqual(expected);
    });
  });

  it('returns 0 for numeric string "0"', () => {
    expect(toMilliseconds('0')).toStrictEqual(0);
  });
});

describe('toSeconds', () => {
  it.each([
    {
      desc:     'returns 0 for empty string',
      input:    '',
      expected: 0,
    },
    {
      desc:     'converts 30s to 30',
      input:    '30s',
      expected: 30,
    },
    {
      desc:     'floors sub-second inputs (500ms → 0)',
      input:    '500ms',
      expected: 0,
    },
    {
      desc:     'floors mixed sub-second remainder (1m30s500ms → 90)',
      input:    '1m30s500ms',
      expected: 90,
    },
    {
      desc:     'converts 2h to 7200',
      input:    '2h',
      expected: 7_200,
    },
  ])('$desc', ({ input, expected }) => {
    expect(toSeconds(input)).toStrictEqual(expected);
  });
});
