import {
  exponentNeeded,
  formatSi,
  parseSi,
  createMemoryFormat,
  createMemoryValues,
  UNITS,
  FRACTIONAL,
  MEMORY_PARSE_RULES,
} from '@shell/utils/units';

describe('units', () => {
  describe('exported constants', () => {
    it('exports expected UNITS prefixes', () => {
      expect(UNITS).toStrictEqual(['', 'K', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y']);
    });

    it('exports expected FRACTIONAL prefixes', () => {
      expect(FRACTIONAL).toStrictEqual(['', 'm', 'u', 'n', 'p', 'f', 'a', 'z', 'y']);
    });
  });

  describe('exponentNeeded', () => {
    it.each([
      {
        desc:     'returns 0 for value below increment',
        value:    999,
        expected: 0,
      },
      {
        desc:     'returns 1 for value equal to increment',
        value:    1000,
        expected: 1,
      },
      {
        desc:     'returns 2 for value 1_000_000',
        value:    1_000_000,
        expected: 2,
      },
      {
        desc:     'returns 3 for value 1_000_000_000',
        value:    1_000_000_000,
        expected: 3,
      },
      {
        desc:      'uses custom increment when provided',
        value:     1024,
        increment: 1024,
        expected:  1,
      },
      {
        desc:     'returns 0 for value 0',
        value:    0,
        expected: 0,
      },
      {
        desc:     'returns 0 for value 1',
        value:    1,
        expected: 0,
      },
    ])('$desc', ({ value, increment, expected }) => {
      expect(exponentNeeded(value, increment)).toStrictEqual(expected);
    });
  });

  describe('formatSi', () => {
    describe('default options (increment=1000)', () => {
      it.each([
        {
          desc:     'formats 0',
          input:    0,
          expected: '0 ',
        },
        {
          desc:     'formats 999',
          input:    999,
          expected: '999 ',
        },
        {
          desc:     'formats 1000 as 1 K',
          input:    1000,
          expected: '1 K',
        },
        {
          desc:     'formats 1500 as 1.5 K',
          input:    1500,
          expected: '1.5 K',
        },
        {
          desc:     'formats 1_000_000 as 1 M',
          input:    1_000_000,
          expected: '1 M',
        },
        {
          desc:     'formats 1_500_000 as 1.5 M',
          input:    1_500_000,
          expected: '1.5 M',
        },
        {
          desc:     'formats 1_000_000_000 as 1 G',
          input:    1_000_000_000,
          expected: '1 G',
        },
        {
          desc:     'formats 1_000_000_000_000 as 1 T',
          input:    1_000_000_000_000,
          expected: '1 T',
        },
        {
          desc:     'formats with 2 decimal precision for values < 10',
          input:    1234,
          expected: '1.23 K',
        },
      ])('$desc', ({ input, expected }) => {
        expect(formatSi(input)).toStrictEqual(expected);
      });
    });

    describe('suffix options', () => {
      it.each([
        {
          desc:     'appends suffix',
          input:    1000,
          options:  { suffix: 'B' },
          expected: '1 KB',
        },
        {
          desc:     'uses firstSuffix for exponent 0',
          input:    500,
          options:  { suffix: 'B', firstSuffix: 'B' },
          expected: '500 B',
        },
        {
          desc:     'does not use firstSuffix when exponent > 0',
          input:    1000,
          options:  { suffix: 'B', firstSuffix: 'B' },
          expected: '1 KB',
        },
        {
          desc:     'omits suffix space when addSuffixSpace=false',
          input:    1000,
          options:  { addSuffixSpace: false, suffix: 'B' },
          expected: '1KB',
        },
        {
          desc:     'omits suffix entirely when addSuffix=false',
          input:    1000,
          options:  { addSuffix: false },
          expected: '1',
        },
      ])('$desc', ({ input, options, expected }) => {
        expect(formatSi(input, options)).toStrictEqual(expected);
      });
    });

    describe('increment=1024', () => {
      it.each([
        {
          desc:    'formats 1024 as 1 KiB',
          input:   1024,
          options: {
            increment:   1024,
            suffix:      'iB',
            firstSuffix: 'B',
          },
          expected: '1 KiB',
        },
        {
          desc:     'formats 1048576 as 1 MiB',
          input:    1048576,
          options:  { increment: 1024, suffix: 'iB' },
          expected: '1 MiB',
        },
      ])('$desc', ({ input, options, expected }) => {
        expect(formatSi(input, options)).toStrictEqual(expected);
      });
    });

    describe('minExponent / maxExponent', () => {
      it.each([
        {
          desc:     'respects minExponent to force higher unit',
          input:    500,
          options:  { minExponent: 1, addSuffix: false },
          expected: '0.5',
        },
        {
          desc:     'respects maxExponent to cap scaling',
          input:    1_000_000,
          options:  { maxExponent: 1, addSuffix: false },
          expected: '1000',
        },
      ])('$desc', ({ input, options, expected }) => {
        expect(formatSi(input, options)).toStrictEqual(expected);
      });
    });

    describe('maxPrecision', () => {
      it.each([
        {
          desc:     'uses integer for maxPrecision=0',
          input:    1500,
          options:  { maxPrecision: 0 },
          expected: '2 K',
        },
        {
          desc:     'uses 1 decimal for maxPrecision=1',
          input:    1500,
          options:  { maxPrecision: 1 },
          expected: '1.5 K',
        },
      ])('$desc', ({ input, options, expected }) => {
        expect(formatSi(input, options)).toStrictEqual(expected);
      });
    });

    describe('canRoundToZero=false', () => {
      it('avoids returning "0" by adjusting exponent', () => {
        // 1 byte formatted as KiB would be 0, but canRoundToZero=false forces min representation
        const result = formatSi(1, {
          increment:      1024,
          canRoundToZero: false,
          suffix:         'iB',
          firstSuffix:    'B',
        });

        expect(result).not.toStrictEqual('0 ');
        expect(result).toStrictEqual('1 B');
      });
    });

    describe('startingExponent', () => {
      it('starts from specified exponent', () => {
        // startingExponent=1 means value is already in K
        expect(formatSi(1, { startingExponent: 1 })).toStrictEqual('1 K');
      });
    });
  });

  describe('parseSi', () => {
    it.each([
      {
        desc:     'parses 1K to 1000',
        input:    '1K',
        expected: 1000,
      },
      {
        desc:     'parses 1M to 1_000_000',
        input:    '1M',
        expected: 1_000_000,
      },
      {
        desc:     'parses 1G to 1_000_000_000',
        input:    '1G',
        expected: 1_000_000_000,
      },
      {
        desc:     'parses 1T to 1_000_000_000_000',
        input:    '1T',
        expected: 1_000_000_000_000,
      },
      {
        desc:     'parses plain number string',
        input:    '500',
        expected: 500,
      },
      {
        desc:     'parses decimal number string',
        input:    '1.5K',
        expected: 1500,
      },
      {
        desc:     'parses KiB with increment=1024',
        input:    '1Ki',
        expected: 1024,
      },
      {
        desc:     'parses MiB with increment=1024',
        input:    '1Mi',
        expected: 1048576,
      },
      {
        desc:     'strips commas from numeric strings',
        input:    '1,000',
        expected: 1000,
      },
      {
        desc:     'ignores unrecognized unit suffix',
        input:    '100X',
        expected: 100,
      },
    ])('$desc', ({ input, expected }) => {
      expect(parseSi(input)).toStrictEqual(expected);
    });

    it.each([
      {
        desc:  'empty string',
        input: '',
      },
      {
        desc:  'null',
        input: null as any,
      },
      {
        desc:  'undefined',
        input: undefined as any,
      },
      {
        desc:  'non-string input',
        input: 123 as any,
      },
    ])('returns NaN for $desc', ({ input }) => {
      expect(parseSi(input)).toStrictEqual(NaN);
    });

    it('parses fractional milli unit (m)', () => {
      // 1m = 1 * 1/1000 = 0.001
      expect(parseSi('1m')).toBeCloseTo(0.001);
    });

    it('falls back to multiply path when allowFractional=false and unit matches UNITS uppercase', () => {
      // 'm'.toUpperCase() === 'M' is in UNITS (Mega), so parsed as 1 * 1000^2 = 1_000_000
      expect(parseSi('1m', { allowFractional: false })).toStrictEqual(1_000_000);
    });

    it('uses custom increment option', () => {
      expect(parseSi('1K', { increment: 1024 })).toStrictEqual(1024);
    });

    it('handles micro symbol (µ) as u', () => {
      // charCode 181 is µ, should be treated as 'u' (micro)
      const mu = String.fromCharCode(181);

      expect(parseSi(`1${ mu }`)).toBeCloseTo(0.000001);
    });
  });

  describe('createMemoryFormat', () => {
    it.each([
      {
        desc:     'locks exponent for 1 KiB',
        value:    1024,
        expected: 1,
      },
      {
        desc:     'sets GiB exponent for 1 GiB',
        value:    1024 * 1024 * 1024,
        expected: 3,
      },
      {
        desc:     'sets byte exponent for 0',
        value:    0,
        expected: 0,
      },
    ])('$desc', ({ value, expected }) => {
      const fmt = createMemoryFormat(value);

      expect(fmt.maxExponent).toStrictEqual(expected);
      expect(fmt.minExponent).toStrictEqual(expected);
    });

    it('includes all MEMORY_PARSE_RULES format properties', () => {
      const base = MEMORY_PARSE_RULES.memory.format;
      const fmt = createMemoryFormat(1024);

      expect(fmt.increment).toStrictEqual(base.increment);
      expect(fmt.addSuffix).toStrictEqual(base.addSuffix);
      expect(fmt.firstSuffix).toStrictEqual(base.firstSuffix);
      expect(fmt.suffix).toStrictEqual(base.suffix);
      expect(fmt.maxPrecision).toStrictEqual(base.maxPrecision);
    });
  });

  describe('createMemoryValues', () => {
    it('converts bytes total and useful to same unit', () => {
      const result = createMemoryValues('1073741824', '536870912'); // 1GiB total, 512MiB useful

      expect(result.total).toStrictEqual(1);
      expect(result.useful).toStrictEqual(0.5);
      expect(result.units).toStrictEqual('GiB');
    });

    it('handles 0 total and useful', () => {
      const result = createMemoryValues('0', '0');

      expect(result.total).toStrictEqual(0);
      expect(result.useful).toStrictEqual(0);
      // UNITS[0] = '' + suffix 'iB' = 'iB'
      expect(result.units).toStrictEqual('iB');
    });

    it('handles null/undefined by treating as 0', () => {
      const result = createMemoryValues(null as any, undefined as any);

      expect(result.total).toStrictEqual(0);
      expect(result.useful).toStrictEqual(0);
      expect(result.units).toStrictEqual('iB');
    });

    it('accepts numeric strings with Si notation', () => {
      const result = createMemoryValues('1Ki', '512');

      expect(result.units).toStrictEqual('KiB');
      expect(result.total).toStrictEqual(1);
      expect(result.useful).toStrictEqual(0.5);
    });

    it('rounds to 2 decimal places', () => {
      // 1.005 * 1024 = 1029.12 bytes, expressed in KiB = ~1.005
      const result = createMemoryValues('1049600', '524800'); // slightly over 1024*1024 and 512*1024

      expect(result.total).toStrictEqual(Math.round((1049600 / 1048576) * 100) / 100);
      expect(result.useful).toStrictEqual(Math.round((524800 / 1048576) * 100) / 100);
    });
  });
});
