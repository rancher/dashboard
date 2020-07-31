import find from 'lodash/find';

export const DEFAULT_SERVICE_TYPES = [
  {
    id:          'ClusterIP',
    label:       'servicesPage.serviceTypes.clusterIp.label',
    description: 'servicesPage.serviceTypes.clusterIp.description',
    bannerAbbrv: 'servicesPage.serviceTypes.clusterIp.abbrv',
  },
  {
    id:          'ExternalName',
    label:       'servicesPage.serviceTypes.externalName.label',
    description: 'servicesPage.serviceTypes.externalName.description',
    bannerAbbrv: 'servicesPage.serviceTypes.externalName.abbrv',
  },
  {
    id:          'Headless',
    label:       'servicesPage.serviceTypes.headless.label',
    description: 'servicesPage.serviceTypes.headless.description',
    bannerAbbrv: 'servicesPage.serviceTypes.headless.abbrv',
  },
  {
    id:          'LoadBalancer',
    label:       'servicesPage.serviceTypes.loadBalancer.label',
    description: 'servicesPage.serviceTypes.loadBalancer.description',
    bannerAbbrv: 'servicesPage.serviceTypes.loadBalancer.abbrv',
  },
  {
    id:          'NodePort',
    label:       'servicesPage.serviceTypes.nodePort.label',
    description: 'servicesPage.serviceTypes.nodePort.description',
    bannerAbbrv: 'servicesPage.serviceTypes.nodePort.abbrv',
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
      {
        nullable:       false,
        path:           'spec.ports',
        required:       true,
        type:           'array',
        validators:     ['servicePort'],
      }
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
