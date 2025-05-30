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

  /**
   * Return the namespace of the v1 prov cluster.
   *
   * Used to construct the prov cluster id
   *
   * objectset.rio.cattle.io/owner-namespace annotation is applied to v3 clusters that were automatically created following the creation of a v1 prov cluster
   */
  get provisioningClusterNs() {
    return this.annotations?.['objectset.rio.cattle.io/owner-namespace'] || 'fleet-default';
  }

  /**
   * Return the name of the v1 prov cluster (note - not the human name, but usually is)
   *
   * Used to construct the prov cluster id.
   *
   * It could be two different forms. If the v1 prov cluster was created ..
   * - automatically following the creation of a v3 cluster = id is the v3 cluster id
   * - directly by the user = id is the (roughly) human name, which is this.id
   *
   * objectset.rio.cattle.io/owner-namespace annotation is applied to v3 clusters that were automatically created following the creation of a v1 prov cluster
   *
   */
  get provisioningClusterName() {
    return this.annotations?.['objectset.rio.cattle.io/owner-name'] || this.id;
  }

  get provisioningClusterId() {
    return `${ this.provisioningClusterNs }/${ this.provisioningClusterName }`;
  }

  waitForProvisioning(timeout = 60000, interval) {
    return this.waitForTestFn(() => {
      const id = this.provisioningClusterId;

      return id && !!this.$rootGetters['management/byId'](CAPI.RANCHER_CLUSTER, id);
    }, this.$rootGetters['i18n/t']('cluster.managementTimeout'), timeout, interval);
  }
}
