const FIELDS = {
  NAME:     'pool.name',
  QUANTITY: 'pool.quantity'
};

const RULESETS = [
  {
    path:  FIELDS.QUANTITY,
    rules: ['requiredInt', 'isPositive'],
  },
  {
    path:  FIELDS.NAME,
    rules: ['required'],
  }
];

export const MACHINE_POOL_VALIDATION = {
  FIELDS,
  RULESETS
};

export const poolName = (ctx:any) => {
  return (name: string) => {
    return !!name ? undefined : ctx.t('validation.required', { key: 'Value' });
  };
};

export const poolQuantity = (ctx:any, min: number) => {
  return (count = 0) => {
    return count >= min ? undefined : ctx.t('validation.number.min', { key: 'Value', val: min });
  };
};
