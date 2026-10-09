import SteveModel from '@shell/plugins/steve/steve-class';
import { relatedEntry, workloadsInNamespace } from '@shell/utils/related-resources';

export default class NetworkPolicy extends SteveModel {
  /**
   * The resources related to this NetworkPolicy, to edit by YAML alongside it
   *
   * Dependents: the workloads in its namespace whose pods `spec.podSelector` selects. Pods
   * matched only as peers of an `ingress` or `egress` rule are not included
   *
   * The workloads are dependents so the tree does not take in the resources they use
   *
   * See https://kubernetes.io/docs/concepts/services-networking/network-policies/
   *
   * @param {import('@shell/core/types').RelatedResourcesFetchOptions} [options]
   * @returns {Promise<import('@shell/core/types').RelatedResource[]>}
   */
  async fetchModelRelatedResources({ dependents = true } = {}) {
    if (!this.metadata?.uid || !dependents) {
      return [];
    }

    const workloads = await workloadsInNamespace(this, this.metadata.namespace);

    return workloads
      .filter((workload) => workload.hasPodsSelectedBy(this.spec?.podSelector))
      .map((workload) => relatedEntry(workload, { dependent: true }));
  }
}
