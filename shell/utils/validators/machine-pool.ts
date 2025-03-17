const FIELDS = {
  NAME:     'poolName',
  QUANTITY: 'poolQuantity'
};

const RULESETS = [
  {
    path:  FIELDS.QUANTITY,
    rules: [FIELDS.QUANTITY, 'requiredInt'],
  },
  {
    path:  FIELDS.NAME,
    rules: [FIELDS.NAME],
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
