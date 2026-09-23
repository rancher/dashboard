import { isValidCIDR, isValidIP, isValidMac } from '@shell/utils/validators/cidr';

describe('fx: isValidCIDR', () => {
  it('should be valid', () => {
    expect(isValidCIDR('10.42.0.0/8')).toBe(true);
  });
  it('should be invalid', () => {
    expect(isValidCIDR('10.42.0.0')).toBe(false);
    expect(isValidCIDR('10.42.0.0/500')).toBe(false);
    expect(isValidCIDR('300.42.0.0/8')).toBe(false);
  });
  it('should be valid for IPv6 CIDR', () => {
    expect(isValidCIDR('2001:db8::/32')).toBe(true);
    expect(isValidCIDR('fe80::/10')).toBe(true);
    expect(isValidCIDR('::1/128')).toBe(true);
    expect(isValidCIDR('::0/0')).toBe(true);
  });
  it('should be invalid for bad IPv6 CIDR', () => {
    expect(isValidCIDR('2001:db8::/129')).toBe(false);
    expect(isValidCIDR('2001:db8::')).toBe(false);
    expect(isValidCIDR('2001:db8::g/32')).toBe(false);
    expect(isValidCIDR('invalid/64')).toBe(false);
    expect(isValidCIDR('2001:db8::/32abc')).toBe(false);
    expect(isValidCIDR('2001:db8::/ 32')).toBe(false);
    expect(isValidCIDR('2001:db8::/0x20')).toBe(false);
  });
});

describe('fx: isValidIP', () => {
  it('should be valid for IPv4', () => {
    expect(isValidIP('10.42.0.1')).toBe(true);
  });
  it('should be valid for IPv6', () => {
    expect(isValidIP('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe(true);
    expect(isValidIP('2001:db8:85a3::8a2e:370:7334')).toBe(true);
    expect(isValidIP('::1')).toBe(true);
    expect(isValidIP('::')).toBe(true);
    expect(isValidIP('fe80::1')).toBe(true);
  });
  it('should be invalid', () => {
    expect(isValidIP('10.42.0.0/8')).toBe(false);
    expect(isValidIP('300.42.0.0')).toBe(false);
    expect(isValidIP('2001:db8:85a3::8a2e:370:7334:1234:5678:9abc')).toBe(false);
    expect(isValidIP('gggg::1')).toBe(false);
    expect(isValidIP('')).toBe(false);
  });
});

describe('fx: isValidMac', () => {
  it('should be valid', () => {
    expect(isValidMac('00-08-20-83-53-D1')).toBe(true);
    expect(isValidMac('00-08-20-83-53-d1')).toBe(true);
  });
  it('should be invalid', () => {
    expect(isValidMac('invalid')).toBe(false);
    expect(isValidMac('00-08-20-83-53')).toBe(false);
  });
});
