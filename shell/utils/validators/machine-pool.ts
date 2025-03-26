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
