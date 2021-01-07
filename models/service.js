import find from 'lodash/find';
import { POD } from '@/config/types';

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
        path:           'spec',
        required:       true,
        type:           'array',
        validators:     ['servicePort'],
      },
      {
        nullable:       true,
        path:           'spec',
        required:       true,
        type:           'string',
        validators:     ['clusterIp'],
      },
      {
        nullable:       true,
        path:           'spec',
        required:       true,
        type:           'array',
        validators:     ['externalName'],
      },
    ];
  },

  details() {
    const out = [{
      label:   this.t('generic.type'),
      content: this.serviceType?.id || this.serviceType,
    }];

    const { clusterIP, externalName, sessionAffinity } = this.spec;

    if (clusterIP) {
      out.push({
        label:   'ClusterIP',
        content: clusterIP,
      });
    }

    if (externalName) {
      out.push({
        label:   'External Name',
        content: externalName,
      });
    }

    if (sessionAffinity) {
      out.push({
        label:   'Session Affinity',
        content: sessionAffinity,
      });
    }

    return out;
  },

  pods() {
    const { metadata:{ relationships = [] } } = this;

    return async() => {
      const podRelationship = (relationships || []).filter(relationship => relationship.toType === POD)[0];
      let pods = [];

      if (podRelationship) {
        pods = await this.$dispatch('cluster/findMatching', { type: POD, selector: podRelationship.selector }, { root: true });
      }

      return pods;
    };
  },

  serviceType() {
    const serviceType = this.spec?.type;
    const clusterIp = this.spec?.clusterIP;
    const defaultService = find(DEFAULT_SERVICE_TYPES, ['id', CLUSTERIP]);

    if (serviceType) {
      if (serviceType === CLUSTERIP && clusterIp === 'None') {
        return HEADLESS;
      } else {
        return serviceType;
      }
    }

    return defaultService;
  },

  proxyUrl() {
    return (proto, port) => {
      const view = this.linkFor('view');
      const idx = view.lastIndexOf(`/`);

      return `${ view.slice(0, idx) }/${ proto }:${ this.metadata.name }:${ port }/proxy`;
    };
  }
};
