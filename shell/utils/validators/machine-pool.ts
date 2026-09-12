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
    rules: ['required', 'uniquePoolName'],
  },
  // The autoscaler bounds live on the pool while it is autoscaling and in the pool's stash while it is paused, so they
  // are checked by rules that read the range rather than the value at the path
  {
    path:  FIELDS.AUTOSCALER_MIN,
    rules: ['isAutoscalerMinSizeValid', 'isAutoscalerMaxGreaterThanMin'],
  },
  {
    path:  FIELDS.AUTOSCALER_MAX,
    rules: ['isAutoscalerMaxSizeValid', 'isAutoscalerMaxGreaterThanMin'],
  },
];

export const MACHINE_POOL_VALIDATION = {
  FIELDS,
  RULESETS
};
