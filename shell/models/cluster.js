import NormanModel from '@shell/plugins/steve/norman-class';
import { CAPI } from '@shell/config/types';

export const LABEL_CONTAINS_PROTECTED = [
  'io.cattle.lifecycle',
  'kubernetes.io',
  'cattle.io',
  'k3s.io',
];

export const ANNOTATIONS_CONTAINS_PROTECTED = [
  'coreos.com',
  'cattle.io',
  'k3s.io',
  'kubernetes.io',
  'k3s.io',
  'rancher.io'
];
export default class NormanCluster extends NormanModel {
  get systemLabels() {
    return Object.keys(this.labels || {}).filter((key) => LABEL_CONTAINS_PROTECTED.find((label) => key.includes(label)));
  }

  get systemAnnotations() {
    return Object.keys(this.annotations || {}).filter((key) => ANNOTATIONS_CONTAINS_PROTECTED.find((annotation) => key.includes(annotation)));
  }

  get hasSystemLabels() {
    return !!(this.systemLabels || []).length;
  }

  get hasSystemAnnotations() {
    return !!(this.systemAnnotations || []).length;
  }

  waitForProvisioning(timeout = 60000, interval) {
    return this.waitForTestFn(() => {
      const ns = this.annotations['objectset.rio.cattle.io/owner-namespace'] || 'fleet-default';
      const id = `${ ns }/${ this.id }`;

      return id && !!this.$rootGetters['management/byId'](CAPI.RANCHER_CLUSTER, id);
    }, this.$rootGetters['i18n/t']('cluster.managementTimeout'), timeout, interval);
  }
}
