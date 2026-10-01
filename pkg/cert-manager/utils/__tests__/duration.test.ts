import { parseDuration, durationToParts, partsToDuration } from '../duration';

describe('fx: parseDuration', () => {
  it.each([
    ['2160h0m0s', 7776000],
    ['720h', 2592000],
    ['90m', 5400],
    ['1h30m', 5400],
    ['45s', 45],
    ['0h', 0],
    ['1.5h', 5400],
    ['  720h  ', 2592000],
  ])('should parse %s to %i seconds', (input, expected) => {
    expect(parseDuration(input)).toBe(expected);
  });

  it.each([
    ['undefined', undefined],
    ['null', null],
    ['an empty string', ''],
    ['whitespace', '   '],
    // Go's ParseDuration has no day unit, so cert-manager will reject this too
    ['a day unit', '90d'],
    ['a bare number', '720'],
    ['text', 'forever'],
    ['a trailing unit with no value', '1h30'],
  ])('should return null for %s', (_label, input) => {
    expect(parseDuration(input)).toBeNull();
  });
});

describe('fx: durationToParts', () => {
  it.each([
    ['2160h', { value: 90, unit: 'd' }],
    ['24h', { value: 1, unit: 'd' }],
    ['1h', { value: 1, unit: 'h' }],
    ['25h', { value: 25, unit: 'h' }],
    ['90m', { value: 90, unit: 'm' }],
    ['45s', { value: 45, unit: 's' }],
  ])('should split %s into the largest whole unit', (input, expected) => {
    expect(durationToParts(input)).toStrictEqual(expected);
  });

  it('should represent zero in seconds rather than dividing by a larger unit', () => {
    expect(durationToParts('0h')).toStrictEqual({ value: 0, unit: 's' });
  });

  it('should return null for an unparseable duration', () => {
    expect(durationToParts('nonsense')).toBeNull();
  });
});

describe('fx: partsToDuration', () => {
  it('should convert days to hours, because Go cannot parse a day unit', () => {
    expect(partsToDuration(90, 'd')).toBe('2160h');
  });

  it.each([
    [1, 'h', '1h'],
    [90, 'm', '90m'],
    [45, 's', '45s'],
    ['720', 'h', '720h'],
  ])('should format %s %s as %s', (value, unit, expected) => {
    expect(partsToDuration(value, unit as any)).toBe(expected);
  });

  it('should default to hours', () => {
    expect(partsToDuration(12)).toBe('12h');
  });

  it.each([
    ['undefined', undefined],
    ['null', null],
    ['an empty string', ''],
    ['a negative number', -1],
    ['text', 'abc'],
  ])('should return undefined for %s so the field can be omitted', (_label, value) => {
    expect(partsToDuration(value as any, 'h')).toBeUndefined();
  });

  it('should round-trip through durationToParts', () => {
    const parts = durationToParts('2160h');

    expect(partsToDuration(parts?.value, parts?.unit)).toBe('2160h');
  });
});
