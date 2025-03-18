import { poolQuantity, poolName } from '@shell/utils/validators/machine-pool';

const mockCtx = { t: (key: string) => `${ key }` };

describe('fx: poolName', () => {
  it('poolName returns undefined for valid names', () => {
    const validator = poolName(mockCtx);

    expect(validator('valid_name')).toBeUndefined();
  });

  it('poolName returns error for empty name', () => {
    const validator = poolName(mockCtx);

    expect(validator('')).toBe('validation.required');
  });
});

describe('fx: poolQuantity', () => {
  it('poolQuantity returns undefined for valid numbers', () => {
    const validator = poolQuantity(mockCtx, 0);

    expect(validator(5)).toBeUndefined();
  });

  it('poolQuantity returns error for values below minimum', () => {
    const validator = poolQuantity(mockCtx, 0);

    expect(validator(-1)).toBe('validation.number.min');
  });
});
