import { SERVICE } from '@/config/types';
import isUrl from 'is-url';

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
      const serviceName = path?.backend.serviceName;
      const targetLink = {
        url:  this.targetTo(workloads, serviceName),
        text: serviceName
      };
      const port = path?.backend?.servicePort;

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
      const serviceName = path?.backend?.serviceName;
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
      const name = this.spec.backend?.serviceName;

      if ( !name ) {
        return null;
      }

      return {
        name,
        targetTo: this.targetTo(workloads, name)
      };
    };
  }
};
