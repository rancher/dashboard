export const TYPES = {
  EXTENDED:                'extended',
  CONFIG_MAPS:             'configMaps',
  LIMITS_CPU:              'limitsCpu',
  LIMITS_MEM:              'limitsMemory',
  PVC:                     'persistentVolumeClaims',
  PODS:                    'pods',
  REPLICATION_CONTROLLERS: 'replicationControllers',
  REQUESTS_CPU:            'requestsCpu',
  REQUESTS_MEMORY:         'requestsMemory',
  REQUESTS_STORAGE:        'requestsStorage',
  SECRETS:                 'secrets',
  SERVICES:                'services',
  SERVICES_LOAD_BALANCERS: 'servicesLoadBalancers',
  SERVICES_NODE_PORTS:     'servicesNodePorts',
};

export const RANCHER_TYPES = [
  {
    value:          TYPES.EXTENDED,
    inputExponent:  0,
    baseUnit:       '',
    labelKey:       'resourceQuota.custom',
    placeholderKey: 'resourceQuota.projectLimit.unitlessPlaceholder'
  },
  {
    value:          TYPES.CONFIG_MAPS,
    inputExponent:  0,
    baseUnit:       '',
    labelKey:       'resourceQuota.configMaps',
    placeholderKey: 'resourceQuota.projectLimit.unitlessPlaceholder'
  },
  {
    value:          TYPES.LIMITS_CPU,
    inputExponent:  -1,
    baseUnitKey:    'suffix.cpus',
    labelKey:       'resourceQuota.limitsCpu',
    placeholderKey: 'resourceQuota.projectLimit.cpuPlaceholder'
  },
  {
    value:          TYPES.LIMITS_MEM,
    inputExponent:  2,
    increment:      1024,
    labelKey:       'resourceQuota.limitsMemory',
    placeholderKey: 'resourceQuota.projectLimit.memoryPlaceholder'
  },
  {
    value:          TYPES.PVC,
    inputExponent:  0,
    baseUnit:       '',
    labelKey:       'resourceQuota.persistentVolumeClaims',
    placeholderKey: 'resourceQuota.projectLimit.unitlessPlaceholder'
  },
  {
    value:          TYPES.PODS,
    inputExponent:  0,
    baseUnit:       '',
    labelKey:       'resourceQuota.pods',
    placeholderKey: 'resourceQuota.projectLimit.unitlessPlaceholder'
  },
  {
    value:          TYPES.REPLICATION_CONTROLLERS,
    inputExponent:  0,
    baseUnit:       '',
    labelKey:       'resourceQuota.replicationControllers',
    placeholderKey: 'resourceQuota.projectLimit.unitlessPlaceholder'
  },
  {
    value:          TYPES.REQUESTS_CPU,
    inputExponent:  -1,
    baseUnitKey:    'suffix.cpus',
    labelKey:       'resourceQuota.requestsCpu',
    placeholderKey: 'resourceQuota.projectLimit.cpuPlaceholder'
  },
  {
    value:          TYPES.REQUESTS_MEMORY,
    inputExponent:  2,
    increment:      1024,
    labelKey:       'resourceQuota.requestsMemory',
    placeholderKey: 'resourceQuota.projectLimit.memoryPlaceholder'
  },
  {
    value:          TYPES.REQUESTS_STORAGE,
    units:          'storage',
    inputExponent:  2,
    increment:      1024,
    labelKey:       'resourceQuota.requestsStorage',
    placeholderKey: 'resourceQuota.projectLimit.storagePlaceholder'
  },
  {
    value:          TYPES.SECRETS,
    units:          'unitless',
    inputExponent:  0,
    baseUnit:       '',
    labelKey:       'resourceQuota.secrets',
    placeholderKey: 'resourceQuota.projectLimit.unitlessPlaceholder'
  },
  {
    value:          TYPES.SERVICES,
    units:          'unitless',
    inputExponent:  0,
    baseUnit:       '',
    labelKey:       'resourceQuota.services',
    placeholderKey: 'resourceQuota.projectLimit.unitlessPlaceholder'
  },
  {
    value:          TYPES.SERVICES_LOAD_BALANCERS,
    units:          'unitless',
    inputExponent:  0,
    baseUnit:       '',
    labelKey:       'resourceQuota.servicesLoadBalancers',
    placeholderKey: 'resourceQuota.projectLimit.unitlessPlaceholder'
  },
  {
    value:          TYPES.SERVICES_NODE_PORTS,
    units:          'unitless',
    inputExponent:  0,
    baseUnit:       '',
    labelKey:       'resourceQuota.servicesNodePorts',
    placeholderKey: 'resourceQuota.projectLimit.unitlessPlaceholder'
  },
];

export const HARVESTER_TYPES = [
  {
    value:          TYPES.LIMITS_CPU,
    inputExponent:  -1,
    baseUnitKey:    'suffix.cpus',
    labelKey:       'resourceQuota.limitsCpu',
    placeholderKey: 'resourceQuota.projectLimit.cpuPlaceholder'
  },
  {
    value:          TYPES.LIMITS_MEM,
    inputExponent:  2,
    increment:      1024,
    labelKey:       'resourceQuota.limitsMemory',
    placeholderKey: 'resourceQuota.projectLimit.memoryPlaceholder'
  },
  {
    value:          TYPES.REQUESTS_CPU,
    inputExponent:  -1,
    baseUnitKey:    'suffix.cpus',
    labelKey:       'resourceQuota.requestsCpu',
    placeholderKey: 'resourceQuota.projectLimit.cpuPlaceholder'
  },
  {
    value:          TYPES.REQUESTS_MEMORY,
    inputExponent:  2,
    increment:      1024,
    labelKey:       'resourceQuota.requestsMemory',
    placeholderKey: 'resourceQuota.projectLimit.memoryPlaceholder'
  },
];

export const ROW_COMPUTED = {
  typeOption() {
    return this.types.find((type) => type.value === this.type.split('.')[0]);
  }
};

export const QUOTA_COMPUTED = {
  mappedTypes() {
    return this.types
      .map((type) => ({
        label:       this.t(type.labelKey),
        baseUnit:    type.baseUnitKey ? this.t(type.baseUnitKey) : undefined,
        placeholder: this.t(type.placeholderKey),
        ...type,
      }));
  }
};
