import find from 'lodash/find';
import { NODE, POD } from '@shell/config/types';
import SteveModel from '@shell/plugins/steve/steve-class';
import { parse } from '@shell/utils/selector';
import { PaginationFilterEquality, PaginationParamFilter } from '@shell/types/store/pagination.types';

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

/**
 * Use to populate the cache with a node that can be used in Service's target value
 *
 * Service's Target Cell --> shell/components/formatter/ServiceTargets.vue --> shell/components/formatter/Endpoints.vue --> Picks the first one that has a model's externalIp
 */
export const fetchNodesForServiceTargets = async({
  $store,
  inStore,
}) => {
  try {
    const schema = $store.getters[`${ inStore }/schemaFor`](NODE);

    if (schema) {
      if ($store.getters[`${ inStore }/paginationEnabled`](NODE)) {
        // Of type @ActionFindPageArgs
        const findPageArgs = {
          pagination: {
            pageSize: 1,
            // TODO: RC test once https://github.com/rancher/rancher/issues/53459 resolved
            // filters:  [
            //   PaginationParamFilter.createSingleField({
            //     field:    'status.addresses.type',
            //     value:    'ExternalIP',
            //     equality: PaginationFilterEquality.EQUALS
            //   }),
            // ],
          },
        };

        return $store.dispatch(`${ inStore }/findPage`, { type: NODE, opt: findPageArgs });
      } else {
        return $store.dispatch(`${ inStore }/findAll`, { type: NODE });
      }
    }
  } catch {}
};

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

  async fetchPods() {
    if (!this.podRelationship) {
      // If empty or not present, the service is assumed to have an external process managing its endpoints
      return [];
    }

    return await this.$dispatch('findLabelSelector', {
      type:     POD,
      matching: {
        namespace:     this.metadata.namespace,
        labelSelector: { matchExpressions: parse(this.podRelationship?.selector) },
      }
    });
  }

  async unWatchPods() {
    return await this.$dispatch('unwatch', { type: POD, all: true });
  }

  /**
   * This getter expects a superset of workload pods to have been fetched already
   *
   * It assumes fetchPods has been called and should be used instead of the response of fetchPods
   * (findAll --> findLabelSelector world results won't trigger change detection)
   */
  get pods() {
    if (this.podRelationship?.selector) {
      return this.$getters['matchingLabelSelector'](POD, { matchExpressions: parse(this.podRelationship?.selector) }, this.metadata.namespace);
    } else {
      return [];
    }
  }

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
