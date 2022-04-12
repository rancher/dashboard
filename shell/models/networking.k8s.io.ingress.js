import { SECRET, SERVICE } from '@shell/config/types';
import isUrl from 'is-url';
import { get } from '@shell/utils/object';
import isEmpty from 'lodash/isEmpty';
import SteveModel from '@shell/plugins/steve/steve-class';

export default class Ingress extends SteveModel {
  get tlsHosts() {
    const tls = this.spec.tls || [];

    return tls.flatMap(tls => tls.hosts || []);
  }

  get isTlsHost() {
    return host => this.tlsHosts.includes(host);
  }

  targetTo(workloads, serviceName) {
    if (!serviceName) {
      return null;
    }

    const isTargetsWorkload = serviceName.startsWith('ingress-');
    const id = `${ this.namespace }/${ serviceName }`;

    if ( isTargetsWorkload ) {
      const workload = workloads.find(w => w.id === (id));

      return workload?.detailLocation || '';
    } else {
      return {
        name:   'c-cluster-product-resource-namespace-id',
        params: {
          resource:  SERVICE,
          id:        serviceName,
          namespace: this.namespace,
        }
      };
    }
  }

  createRulesForListPage(workloads, certificates) {
    const rules = this.spec.rules || [];

    return rules.flatMap((rule) => {
      const paths = rule?.http?.paths || [];

      return paths.map(path => this.createPathForListPage(workloads, rule, path, certificates));
    });
  }

  createPathForListPage(workloads, rule, path, certificates) {
    const hostValue = rule.host || '';
    const pathValue = path.path || '';
    const serviceName = get(path?.backend, this.serviceNamePath);
    const fullPath = this.fullPath(hostValue, pathValue);

    return {
      // isUrl thinks urls which contain '*' are valid so I'm adding an additional check for '*'
      isUrl:           isUrl(fullPath) && !fullPath.includes('*'),
      pathType:        path.pathType,
      fullPath,
      serviceName,
      serviceTargetTo: this.targetTo(workloads, serviceName),
      certs:           this.certLinks(rule, certificates),
      targetLink:      this.targetLink(workloads, serviceName),
      port:            get(path?.backend, this.servicePortPath)
    };
  }

  fullPath(hostValue, pathValue) {
    let protocol = '';

    if (hostValue) {
      protocol = this.isTlsHost(hostValue) ? 'https://' : 'http://';
    }

    return `${ protocol }${ hostValue }${ pathValue }`;
  }

  certLink(cert, certificates = []) {
    const secretName = cert.secretName || this.t('ingress.rulesAndCertificates.defaultCertificate');
    let to;

    if (cert.secretName && certificates.includes(secretName)) {
      to = {
        name:   'c-cluster-product-resource-namespace-id',
        params: {
          resource: SECRET,
          id:       secretName
        }
      };
    }

    return {
      to,
      text:    secretName,
      options: { internal: true }
    };
  }

  certLinks(rule, certificates) {
    const certs = this.spec.tls || [];
    const matchingCerts = certs.filter((cert) => {
      const hosts = cert.hosts || [];

      return hosts.includes(rule.host);
    });

    return matchingCerts.map(cert => this.certLink(cert, certificates));
  }

  targetLink(workloads, serviceName) {
    return {
      to:      this.targetTo(workloads, serviceName),
      text:    serviceName,
      options: { internal: true }
    };
  }

  createDefaultService(workloads) {
    const backend = get(this.spec, this.defaultBackendPath);
    const serviceName = get(backend, this.serviceNamePath);

    if ( !serviceName ) {
      return null;
    }

    return {
      name:     serviceName,
      targetTo: this.targetTo(workloads, serviceName)
    };
  }

  get cache() {
    if (!this.cacheObject) {
      this.cacheObject = {};
    }

    return this.cacheObject;
  }

  get showPathType() {
    if (!this.cache.showPathType) {
      this.cache.showPathType = this.$rootGetters['cluster/pathExistsInSchema'](this.type, 'spec.rules.http.paths.pathType');
    }

    return this.cache.showPathType;
  }

  get useNestedBackendField() {
    if (!this.cache.useNestedBackendField) {
      this.cache.useNestedBackendField = this.$rootGetters['cluster/pathExistsInSchema'](this.type, 'spec.rules.http.paths.backend.service.name');
    }

    return this.cache.useNestedBackendField;
  }

  get serviceNamePath() {
    const nestedPath = 'service.name';
    const flatPath = 'serviceName';

    return this.useNestedBackendField ? nestedPath : flatPath;
  }

  get servicePortPath() {
    const nestedPath = 'service.port.number';
    const flatPath = 'servicePort';

    return this.useNestedBackendField ? nestedPath : flatPath;
  }

  get defaultBackendPath() {
    const defaultBackend = this.$rootGetters['cluster/pathExistsInSchema'](this.type, 'spec.defaultBackend');

    return defaultBackend ? 'defaultBackend' : 'backend';
  }

  get hasDefaultBackend() {
    return !isEmpty(this.spec[this.defaultBackendPath]);
  }
}
