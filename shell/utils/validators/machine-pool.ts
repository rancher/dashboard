const FIELDS = {
  NAME:           'pool.name',
  QUANTITY:       'pool.quantity',
  AUTOSCALER_MIN: 'pool.autoscalingMinSize',
  AUTOSCALER_MAX: 'pool.autoscalingMaxSize'
};

const RULESETS = [
  {
    path:  FIELDS.QUANTITY,
    rules: ['requiredInt', 'isPositive'],
  },
  {
    path:  FIELDS.NAME,
    rules: ['required'],
  },
  {
    path:  FIELDS.AUTOSCALER_MIN,
    rules: ['isPositive', 'isAutoscalerMaxGreaterThanMin'],
  },
  {
    path:  FIELDS.AUTOSCALER_MAX,
    rules: ['isPositive', 'isAutoscalerMaxGreaterThanMin'],
  },
];

export const MACHINE_POOL_VALIDATION = {
  FIELDS,
  RULESETS
};
