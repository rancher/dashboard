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
  describe('uNITS / FRACTIONAL constants', () => {
    it('uNITS contains SI prefixes', () => {
      expect(UNITS).toStrictEqual(['', 'K', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y']);
    });

    it('fRACTIONAL contains fractional SI prefixes', () => {
      expect(FRACTIONAL).toStrictEqual(['', 'm', 'u', 'n', 'p', 'f', 'a', 'z', 'y']);
    });
  });

  describe('exponentNeeded', () => {
    it('returns 0 for value below increment', () => {
      expect(exponentNeeded(999)).toStrictEqual(0);
    });

    it('returns 1 for value equal to increment', () => {
      expect(exponentNeeded(1000)).toStrictEqual(1);
    });

    it('returns 2 for value 1_000_000', () => {
      expect(exponentNeeded(1_000_000)).toStrictEqual(2);
    });

    it('returns 3 for value 1_000_000_000', () => {
      expect(exponentNeeded(1_000_000_000)).toStrictEqual(3);
    });

    it('uses custom increment when provided', () => {
      expect(exponentNeeded(1024, 1024)).toStrictEqual(1);
    });

    it('returns 0 for value 0', () => {
      expect(exponentNeeded(0)).toStrictEqual(0);
    });

    it('returns 0 for value 1', () => {
      expect(exponentNeeded(1)).toStrictEqual(0);
    });
  });

  describe('formatSi', () => {
    describe('default options (increment=1000)', () => {
      it.each([
        [0, '0 '],
        [999, '999 '],
        [1000, '1 K'],
        [1500, '1.5 K'],
        [1_000_000, '1 M'],
        [1_500_000, '1.5 M'],
        [1_000_000_000, '1 G'],
        [1_000_000_000_000, '1 T'],
      ])('formats %d correctly', (input, expected) => {
        expect(formatSi(input)).toStrictEqual(expected);
      });

      it('formats value with 2 decimal precision for values < 10', () => {
        expect(formatSi(1234)).toStrictEqual('1.23 K');
      });
    });

    describe('suffix options', () => {
      it('appends suffix', () => {
        expect(formatSi(1000, { suffix: 'B' })).toStrictEqual('1 KB');
      });

      it('uses firstSuffix for exponent 0', () => {
        expect(formatSi(500, { suffix: 'B', firstSuffix: 'B' })).toStrictEqual('500 B');
      });

      it('does not use firstSuffix when exponent > 0', () => {
        expect(formatSi(1000, { suffix: 'B', firstSuffix: 'B' })).toStrictEqual('1 KB');
      });

      it('omits suffix space when addSuffixSpace=false', () => {
        expect(formatSi(1000, { addSuffixSpace: false, suffix: 'B' })).toStrictEqual('1KB');
      });

      it('omits suffix entirely when addSuffix=false', () => {
        expect(formatSi(1000, { addSuffix: false })).toStrictEqual('1');
      });
    });

    describe('increment=1024', () => {
      it('formats 1024 as 1 K', () => {
        expect(formatSi(1024, {
          increment: 1024, suffix: 'iB', firstSuffix: 'B'
        })).toStrictEqual('1 KiB');
      });

      it('formats 1048576 as 1 M', () => {
        expect(formatSi(1048576, { increment: 1024, suffix: 'iB' })).toStrictEqual('1 MiB');
      });
    });

    describe('minExponent / maxExponent', () => {
      it('respects minExponent to force higher unit', () => {
        // minExponent=1 forces into K range
        expect(formatSi(500, { minExponent: 1, addSuffix: false })).toStrictEqual('0.5');
      });

      it('respects maxExponent to cap scaling', () => {
        // maxExponent=1 caps at K, so 1_000_000 stays as 1000 K
        expect(formatSi(1_000_000, { maxExponent: 1, addSuffix: false })).toStrictEqual('1000');
      });
    });

    describe('maxPrecision', () => {
      it('uses integer for maxPrecision=0 on small values', () => {
        expect(formatSi(1500, { maxPrecision: 0 })).toStrictEqual('2 K');
      });

      it('uses 1 decimal for maxPrecision=1', () => {
        expect(formatSi(1500, { maxPrecision: 1 })).toStrictEqual('1.5 K');
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
      ['1K', 1000],
      ['1M', 1_000_000],
      ['1G', 1_000_000_000],
      ['1T', 1_000_000_000_000],
    ])('parses %s to %d (default increment=1000)', (input, expected) => {
      expect(parseSi(input)).toStrictEqual(expected);
    });

    it('parses plain number string', () => {
      expect(parseSi('500')).toStrictEqual(500);
    });

    it('parses decimal number string', () => {
      expect(parseSi('1.5K')).toStrictEqual(1500);
    });

    it('parses KiB with increment=1024', () => {
      expect(parseSi('1Ki')).toStrictEqual(1024);
    });

    it('parses MiB with increment=1024', () => {
      expect(parseSi('1Mi')).toStrictEqual(1048576);
    });

    it('returns NaN for empty string', () => {
      expect(parseSi('')).toStrictEqual(NaN);
    });

    it('returns NaN for null/undefined', () => {
      expect(parseSi(null as any)).toStrictEqual(NaN);
      expect(parseSi(undefined as any)).toStrictEqual(NaN);
    });

    it('returns NaN for non-string input', () => {
      expect(parseSi(123 as any)).toStrictEqual(NaN);
    });

    it('strips commas from numeric strings', () => {
      expect(parseSi('1,000')).toStrictEqual(1000);
    });

    it('ignores unrecognized unit suffix', () => {
      expect(parseSi('100X')).toStrictEqual(100);
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
    it('returns format with exponent locked for given value', () => {
      const fmt = createMemoryFormat(1024);

      expect(fmt.maxExponent).toStrictEqual(1);
      expect(fmt.minExponent).toStrictEqual(1);
      expect(fmt.increment).toStrictEqual(1024);
      expect(fmt.suffix).toStrictEqual('iB');
    });

    it('sets GiB exponent for 1 GiB', () => {
      const fmt = createMemoryFormat(1024 * 1024 * 1024);

      expect(fmt.maxExponent).toStrictEqual(3);
      expect(fmt.minExponent).toStrictEqual(3);
    });

    it('sets byte exponent for 0', () => {
      const fmt = createMemoryFormat(0);

      expect(fmt.maxExponent).toStrictEqual(0);
      expect(fmt.minExponent).toStrictEqual(0);
    });

    it('includes all MEMORY_PARSE_RULES format properties', () => {
      const base = MEMORY_PARSE_RULES.memory.format;
      const fmt = createMemoryFormat(0);

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
    });

    it('accepts numeric strings with Si notation', () => {
      const result = createMemoryValues('1Ki', '512');

      expect(result.units).toStrictEqual('KiB');
      expect(result.total).toStrictEqual(1);
    });

    it('rounds to 2 decimal places', () => {
      // 1.005 * 1024 = 1029.12 bytes, expressed in KiB = ~1.005
      const result = createMemoryValues('1049600', '524800'); // slightly over 1024*1024 and 512*1024

      expect(result.total).toStrictEqual(Math.round((1049600 / 1048576) * 100) / 100);
      expect(result.useful).toStrictEqual(Math.round((524800 / 1048576) * 100) / 100);
    });
  });
});
