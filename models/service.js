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
};
