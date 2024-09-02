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
});

describe('fx: isValidIP', () => {
  it('should be valid', () => {
    expect(isValidIP('10.42.0.1')).toBe(true);
  });
  it('should be invalid', () => {
    expect(isValidIP('10.42.0.0/8')).toBe(false);
    expect(isValidIP('300.42.0.0')).toBe(false);
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
