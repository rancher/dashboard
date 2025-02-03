import find from 'lodash/find';
import { POD } from '@shell/config/types';
import SteveModel from '@shell/plugins/steve/steve-class';
import { parse } from '@shell/utils/selector';
import { FilterArgs } from '@shell/types/store/pagination.types';
import { isEmpty } from 'lodash';

// i18n-uses servicesPage.serviceTypes.clusterIp.*, servicesPage.serviceTypes.externalName.*, servicesPage.serviceTypes.headless.*
// i18n-uses servicesPage.serviceTypes.loadBalancer.*, servicesPage.serviceTypes.nodePort.*
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

export default class Service extends SteveModel {
  get customValidationRules() {
    return [
      {
        nullable:       false,
        path:           'metadata.name',
        required:       true,
        translationKey: 'generic.name',
        type:           'dnsLabel',
      },
      {
        nullable:   false,
        path:       'spec',
        required:   true,
        type:       'array',
        validators: ['servicePort'],
      },
      {
        nullable:   true,
        path:       'spec',
        required:   true,
        type:       'string',
        validators: ['clusterIp'],
      },
      {
        nullable:   true,
        path:       'spec',
        required:   true,
        type:       'array',
        validators: ['externalName'],
      },
    ];
  }

  get details() {
    const out = [{
      label:   this.t('generic.type'),
      content: this.serviceType?.id || this.serviceType,
    }];

    const {
      clusterIP, externalName, sessionAffinity, loadBalancerIP
    } = this.spec;

    if (clusterIP) {
      out.push({
        label:   this.t('servicesPage.serviceTypes.clusterIp.label'),
        content: clusterIP,
      });
    }

    if (this.serviceType === 'LoadBalancer') {
      const statusIps = this.status.loadBalancer?.ingress?.map((ingress) => ingress.hostname || ingress.ip).join(', ');

      const loadbalancerInfo = loadBalancerIP || statusIps || '';

      if (loadbalancerInfo) {
        out.push({
          label:   this.t('servicesPage.ips.loadBalancer.label'),
          content: loadbalancerInfo
        });
      }
    }

    if (externalName) {
      out.push({
        label:   this.t('servicesPage.serviceTypes.externalName.label'),
        content: externalName,
      });
    }

    if (sessionAffinity) {
      out.push({
        label:   this.t('servicesPage.affinity.label'),
        content: sessionAffinity,
      });
    }

    return out;
  }

  get podRelationship() {
    const { metadata:{ relationships = [] } } = this;

    return (relationships || []).filter((relationship) => relationship.toType === POD)[0];
  }

  /**
   * TODO: RC docs. always return object (relationship selectors are strings)
   */
  get podSelector() {
    const { spec: { selector = { } } } = this;

    // const selector = this.podRelationship?.selector;
    // if (typeof selector === 'string') {
    //   return {
    //     matchExpressions: parse(selector)
    //   }
    // }

    if (isEmpty(selector)) {
      return undefined;
    }

    return { matchLabels: selector // TODO: RC confirm this is alll is ever is??? can it be string | exp[] | ??
    };
  }

  // TODO: RC confirm with pagination off.... no findPage usage
  // TODO: RC ARG??? podSelector vs  this.podRelationship.selector

  async fetchPods() {
    // TODO: RC TEST
    if (!this.podRelationship?.selector) {
      return;
    }

    return await this.$dispatch('findLabelSelector', {
      type:     POD,
      matching: {
        namespace:     this.metadata.namespace,
        labelSelector: { matchLabels: this.podRelationship.selector } // TODO: RC is this string or map
      }
      // findPageOpts: { // Of type ActionFindPageArgs
      //   namespaced: this.metadata.namespace,
      //   pagination: new FilterArgs({ labelSelector: { matchLabels: this.podRelationship.selector} }),
      // },
      // findMatchingOpts: {
      //   type:      POD,
      //   selector:  this.podRelationship.selector,
      //   namespace: this.namespace
      // }
    });
  }

  get pods() {
    // TODO: RC What uses this??
    console.warn('Anything using this must be updated to ????!!!');

    return [];
  }
  // get pods() {
  //   return this.podRelationship ? this.$getters.matching( POD, this.podRelationship.selector, this.namespace ) : [];
  // }

  get serviceType() {
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
  }

  proxyUrl(scheme, port) {
    const view = this.linkFor('view');
    const idx = view.lastIndexOf(`/`);

    return proxyUrlFromBase(view.slice(0, idx), scheme, this.metadata.name, port);
  }
}

export function proxyUrlFromParts(clusterId, namespace, name, scheme, port, path) {
  const base = `/k8s/clusters/${ escape(clusterId) }/api/v1/namespaces/${ escape(namespace) }/services`;

  return proxyUrlFromBase(base, scheme, name, port, path);
}

export function proxyUrlFromBase(base, scheme, name, port, path) {
  const schemaNamePort = (scheme ? `${ escape(scheme) }:` : '') + escape(name) + (port ? `:${ escape(port) }` : '');

  const cleanPath = `/${ (path || '').replace(/^\/+/g, '') }`;
  const cleanBase = base.replace(/\/+$/g, '');

  const out = `${ cleanBase }/${ schemaNamePort }/proxy${ cleanPath }`;

  return out;
}
