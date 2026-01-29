import {
  UNITS,
  FRACTIONAL,
  formatSi,
  parseSi,
  exponentNeeded,
  createMemoryFormat,
  createMemoryValues,
  MEMORY_PARSE_RULES
} from '@shell/utils/units';

describe('constants', () => {
  it('should export UNITS array with correct values', () => {
    expect(UNITS).toStrictEqual(['', 'K', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y']);
  });

  it('should export FRACTIONAL array with correct values', () => {
    expect(FRACTIONAL).toStrictEqual(['', 'm', 'u', 'n', 'p', 'f', 'a', 'z', 'y']);
  });
});

describe('fx: formatSi', () => {
  it('should format small values without suffix when addSuffix is false', () => {
    const result = formatSi(500, { addSuffix: false });

    expect(result).toBe('500');
  });

  it('should format values with K suffix for thousands', () => {
    const result = formatSi(1500);

    expect(result).toBe('1.5 K');
  });

  it('should format values with M suffix for millions', () => {
    const result = formatSi(1500000);

    expect(result).toBe('1.5 M');
  });

  it('should format values with G suffix for billions', () => {
    const result = formatSi(1500000000);

    expect(result).toBe('1.5 G');
  });

  it('should respect maxPrecision option', () => {
    const result = formatSi(1234, { maxPrecision: 1 });

    expect(result).toBe('1.2 K');
  });

  it('should use custom increment value', () => {
    const result = formatSi(1024, { increment: 1024 });

    expect(result).toBe('1 K');
  });

  it('should use custom suffix', () => {
    const result = formatSi(1000, { suffix: 'B' });

    expect(result).toBe('1 KB');
  });

  it('should use firstSuffix when exponent is 0', () => {
    const result = formatSi(500, { firstSuffix: 'B' });

    expect(result).toBe('500 B');
  });

  it('should respect minExponent option', () => {
    const result = formatSi(500, { minExponent: 1 });

    expect(result).toBe('0.5 K');
  });

  it('should respect maxExponent option', () => {
    const result = formatSi(1500000000, { maxExponent: 1 });

    expect(result).toBe('1500000 K');
  });

  it('should format zero correctly', () => {
    const result = formatSi(0);

    expect(result).toBe('0 ');
  });

  it('should handle canRoundToZero option', () => {
    const resultWithRounding = formatSi(100, {
      canRoundToZero: true,
      minExponent:    3,
      maxExponent:    3,
      maxPrecision:   0
    });

    const resultWithoutRounding = formatSi(100, {
      canRoundToZero: false,
      minExponent:    3,
      maxExponent:    3,
      maxPrecision:   0
    });

    expect(resultWithRounding).toBe('0 G');
    expect(resultWithoutRounding).not.toBe('0 G');
  });

  it('should remove space before suffix when addSuffixSpace is false', () => {
    const result = formatSi(1000, { addSuffixSpace: false });

    expect(result).toBe('1K');
  });
});

describe('fx: parseSi', () => {
  it('should return NaN for empty string', () => {
    expect(parseSi('')).toBeNaN();
  });

  it('should return NaN for null', () => {
    expect(parseSi(null as any)).toBeNaN();
  });

  it('should return NaN for undefined', () => {
    expect(parseSi(undefined as any)).toBeNaN();
  });

  it('should parse plain numbers', () => {
    expect(parseSi('100')).toBe(100);
  });

  it('should parse numbers with K suffix', () => {
    expect(parseSi('1K')).toBe(1000);
  });

  it('should parse numbers with M suffix', () => {
    expect(parseSi('1M')).toBe(1000000);
  });

  it('should parse numbers with G suffix', () => {
    expect(parseSi('1G')).toBe(1000000000);
  });

  it('should parse numbers with Ki suffix (1024 increment)', () => {
    expect(parseSi('1Ki')).toBe(1024);
  });

  it('should parse numbers with Mi suffix (1024 increment)', () => {
    expect(parseSi('1Mi')).toBe(1048576);
  });

  it('should parse fractional units (milli)', () => {
    expect(parseSi('1m')).toBe(0.001);
  });

  it('should parse fractional units (micro)', () => {
    expect(parseSi('1u')).toBe(0.000001);
  });

  it('should handle mu symbol for micro', () => {
    expect(parseSi('1µ')).toBe(0.000001);
  });

  it('should parse decimal values', () => {
    expect(parseSi('1.5K')).toBe(1500);
  });

  it('should handle commas in numbers', () => {
    expect(parseSi('1,000')).toBe(1000);
  });

  it('should parse negative values', () => {
    expect(parseSi('-1K')).toBe(-1000);
  });

  it('should use custom increment option', () => {
    expect(parseSi('1K', { increment: 1024 })).toBe(1024);
  });
});

describe('fx: exponentNeeded', () => {
  it('should return 0 for values less than increment', () => {
    expect(exponentNeeded(500)).toBe(0);
  });

  it('should return 1 for values in thousands', () => {
    expect(exponentNeeded(1500)).toBe(1);
  });

  it('should return 2 for values in millions', () => {
    expect(exponentNeeded(1500000)).toBe(2);
  });

  it('should return 3 for values in billions', () => {
    expect(exponentNeeded(1500000000)).toBe(3);
  });

  it('should work with custom increment', () => {
    expect(exponentNeeded(1024, 1024)).toBe(1);
    expect(exponentNeeded(1048576, 1024)).toBe(2);
  });
});

describe('fx: createMemoryFormat', () => {
  it('should create format with correct exponent for bytes', () => {
    const format = createMemoryFormat(500);

    expect(format.minExponent).toBe(0);
    expect(format.maxExponent).toBe(0);
  });

  it('should create format with correct exponent for KiB', () => {
    const format = createMemoryFormat(2048);

    expect(format.minExponent).toBe(1);
    expect(format.maxExponent).toBe(1);
  });

  it('should create format with correct exponent for MiB', () => {
    const format = createMemoryFormat(2097152);

    expect(format.minExponent).toBe(2);
    expect(format.maxExponent).toBe(2);
  });

  it('should include memory format settings', () => {
    const format = createMemoryFormat(1024);

    expect(format.increment).toBe(1024);
    expect(format.suffix).toBe('iB');
    expect(format.firstSuffix).toBe('B');
  });
});

describe('fx: createMemoryValues', () => {
  it('should create memory values from string inputs', () => {
    const result = createMemoryValues('1Gi', '512Mi');

    expect(result).toHaveProperty('total');
    expect(result).toHaveProperty('useful');
    expect(result).toHaveProperty('units');
  });

  it('should handle zero values', () => {
    const result = createMemoryValues('0', '0');

    expect(result.total).toBe(0);
    expect(result.useful).toBe(0);
  });

  it('should handle null values', () => {
    const result = createMemoryValues(null as any, null as any);

    expect(result.total).toBe(0);
    expect(result.useful).toBe(0);
  });

  it('should handle undefined values', () => {
    const result = createMemoryValues(undefined as any, undefined as any);

    expect(result.total).toBe(0);
    expect(result.useful).toBe(0);
  });

  it('should return correct units string', () => {
    const result = createMemoryValues('1Gi', '512Mi');

    expect(result.units).toContain('iB');
  });
});

describe('memory parse rules', () => {
  it('should have memory format configuration', () => {
    expect(MEMORY_PARSE_RULES.memory.format).toBeDefined();
    expect(MEMORY_PARSE_RULES.memory.format.increment).toBe(1024);
    expect(MEMORY_PARSE_RULES.memory.format.suffix).toBe('iB');
    expect(MEMORY_PARSE_RULES.memory.format.firstSuffix).toBe('B');
  });
});
