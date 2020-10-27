import { SERVICE } from '@/config/types';
import isUrl from 'is-url';
import { get } from '@/utils/object';

export default {
  tlsHosts() {
    const tls = this.spec.tls || [];

    return tls.flatMap(tls => tls.hosts || []);
  },

  isTlsHost() {
    return host => this.tlsHosts.includes(host);
  },

  targetTo() {
    return (workloads, serviceName) => {
      if (!serviceName) {
        return null;
      }

      const isTargetsWorkload = !serviceName.startsWith('ingress-');
      const id = `${ this.namespace }/${ serviceName }`;

      if ( isTargetsWorkload ) {
        const workload = workloads.find(w => w.id === (id));

        return workload?.detailLocation || '';
      } else {
        return {
          resource:  SERVICE,
          id:        serviceName,
          namespace: this.namespace
        };
      }
    };
  },

  createRulesForDetailPage() {
    return (workloads) => {
      const rules = this.spec.rules || [];

      return rules.map((rule) => {
        const rawPaths = rule?.http?.paths || [];
        const paths = rawPaths.map(path => this.createPathForDetailPage(workloads, path));

        return {
          host: rule.host,
          paths,
        };
      });
    };
  },

  createPathForDetailPage() {
    return (workloads, path) => {
      const pathPath = path.path || this.$rootGetters['i18n/t']('generic.na');
      const serviceName = get(path?.backend, this.serviceNamePath);
      const targetLink = {
        url:  this.targetTo(workloads, serviceName),
        text: serviceName
      };
      const port = get(path?.backend, this.servicePortPath);

      return {
        pathType: path.pathType, path: pathPath, targetLink, port
      };
    };
  },

  createRulesForListPage() {
    return (workloads) => {
      const rules = this.spec.rules || [];

      if (!rules.flatMap) {
        return [];
      }

      return rules.flatMap((rule) => {
        const paths = rule?.http?.paths || [];

        return paths.map(path => this.createPathForListPage(workloads, rule, path));
      });
    };
  },

  createPathForListPage() {
    return (workloads, rule, path) => {
      const hostValue = rule.host || '';
      const pathValue = path.path || '';
      const serviceName = get(path?.backend, this.serviceNamePath);
      let protocol = '';

      if (hostValue) {
        protocol = this.isTlsHost(hostValue) ? 'https://' : 'http://';
      }

      const target = `${ protocol }${ hostValue }${ pathValue }`;
      // isUrl thinks urls which contain '*' are valid so I'm adding an additional check for '*'
      const isTargetUrl = isUrl(target) && !target.includes('*');

      return {
        isUrl:           isTargetUrl,
        target,
        serviceName,
        serviceTargetTo: this.targetTo(workloads, serviceName)
      };
    };
  },

  createDefaultService() {
    return (workloads) => {
      const backend = get(this.spec, this.defaultBackendPath);
      const serviceName = get(backend, this.serviceNamePath);

      if ( !serviceName ) {
        return null;
      }

      return {
        name:     serviceName,
        targetTo: this.targetTo(workloads, serviceName)
      };
    };
  },

  showPathType() {
    const ingressExpandedSchema = this.$rootGetters['cluster/expandedSchema'](this.type);
    const spec = ingressExpandedSchema?.expandedResourceFields?.spec;
    const rules = spec?.expandedResourceFields?.rules;
    const http = rules?.expandedSubType?.expandedResourceFields?.http;
    const paths = http?.expandedResourceFields?.paths;
    const pathType = paths?.expandedSubType?.expandedResourceFields?.pathType;

    return !!pathType;
  },

  useNestedBackendField() {
    const ingressExpandedSchema = this.$rootGetters['cluster/expandedSchema'](this.type);
    const spec = ingressExpandedSchema?.expandedResourceFields?.spec;
    const rules = spec?.expandedResourceFields?.rules;
    const http = rules?.expandedSubType?.expandedResourceFields?.http;
    const paths = http?.expandedResourceFields?.paths;
    const backend = paths?.expandedSubType?.expandedResourceFields?.backend;
    const service = backend?.expandedResourceFields?.service;
    const name = service?.expandedResourceFields?.name;

    return !!name;
  },

  serviceNamePath() {
    const nestedPath = 'service.name';
    const flatPath = 'serviceName';

    return this.useNestedBackendField ? nestedPath : flatPath;
  },

  servicePortPath() {
    const nestedPath = 'service.port.number';
    const flatPath = 'servicePort';

    return this.useNestedBackendField ? nestedPath : flatPath;
  },

  defaultBackendPath() {
    const ingressExpandedSchema = this.$rootGetters['cluster/expandedSchema'](this.type);
    const spec = ingressExpandedSchema?.expandedResourceFields?.spec;
    const defaultBackend = spec?.expandedResourceFields?.defaultBackend;

    return defaultBackend ? 'defaultBackend' : 'backend';
  }
};
