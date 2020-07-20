import find from 'lodash/find';

export const DEFAULT_SERVICE_TYPES = [
  {
    id:               'ClusterIP',
    translationLabel: 'serviceTypes.clusterip'
  },
  {
    id:               'ExternalName',
    translationLabel: 'serviceTypes.externalname'
  },
  {
    id:               'Headless',
    translationLabel: 'serviceTypes.headless'
  },
  {
    id:               'LoadBalancer',
    translationLabel: 'serviceTypes.loadbalancer'
  },
  {
    id:               'NodePort',
    translationLabel: 'serviceTypes.nodeport'
  },
];

export const HEADLESS = (() => {
  const headless = find(DEFAULT_SERVICE_TYPES, ['id', 'Headless']);

  return headless.id;
})();

export const CLUSTERIP = (() => {
  const clusterIp = find(DEFAULT_SERVICE_TYPES, ['id', 'ClusterIP']);

  return clusterIp.id;
})();

export default {
  // if not a function it does exist, why?
  customValidationRules() {
    return [
      {
        nullable:       false,
        path:           'metadata.name',
        required:       true,
        translationKey: 'generic.name',
        type:           'dnsLabel',
      },
      // {
      //   nullable:       false,
      //   path:           'spec.ports',
      //   required:       true,
      //   type:           'array',
      //   validators:     ['servicePort'],
      // }
    ];
  },

  details() {
    return [{
      label:   this.t('generic.type'),
      content: this.serviceType.id,
    }];
  },

  serviceType() {
    const serviceType = this.value?.spec?.type;
    const clusterIp = this.value?.spec?.clusterIP;
    const defaultService = find(DEFAULT_SERVICE_TYPES, ['id', CLUSTERIP]);

    if (serviceType) {
      if (serviceType === CLUSTERIP && clusterIp === 'None') {
        return HEADLESS;
      } else {
        return serviceType;
      }
    }

    return defaultService;
  }
};
