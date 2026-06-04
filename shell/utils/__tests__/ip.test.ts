import { isV4Format, isV6Format } from '@shell/utils/ip';

describe('isV4Format', () => {
  it.each([
    ['192.168.1.1', true],
    ['0.0.0.0', true],
    ['255.255.255.255', true],
    ['10.0.0.1', true],
    ['127.0.0.1', true],
    ['1.2.3.4', true],
    ['999.999.999.999', true], // regex only checks digit count (1-3), not value range
  ])('should return true for %s', (input, expected) => {
    expect(isV4Format(input)).toStrictEqual(expected);
  });

  it.each([
    [''],
    ['1.2.3'],
    ['1.2.3.4.5'],
    ['abc.def.ghi.jkl'],
    ['1234.1.1.1'],
    ['1.2.3.4/24'],
    ['::1'],
    ['hello'],
    ['1.2.3.'],
    ['.1.2.3'],
    ['192.168.1.1:8080'],
  ])('should return false for invalid input %s', (input) => {
    expect(isV4Format(input)).toStrictEqual(false);
  });
});

describe('isV6Format', () => {
  it.each([
    ['::1', true],
    ['::', true],
    ['fe80::1', true],
    ['2001:0db8:85a3:0000:0000:8a2e:0370:7334', true],
    ['2001:db8:85a3::8a2e:370:7334', true],
    ['::ffff:192.168.1.1', true],
  ])('should return true for %s', (input, expected) => {
    expect(isV6Format(input)).toStrictEqual(expected);
  });

  it.each([
    ['fe80::1%eth0'],
    ['hello'],
    ['xyz'],
    ['gggg'],
  ])('should return false for invalid input %s', (input) => {
    expect(isV6Format(input)).toStrictEqual(false);
  });

  describe('known false positives from the original ip package regex', () => {
    it.each([
      ['', true],
      ['12345', true],
      ['192.168.1.1', true],
    ])('should match %s as IPv6 (false positive)', (input, expected) => {
      expect(isV6Format(input)).toStrictEqual(expected);
    });
  });
});
