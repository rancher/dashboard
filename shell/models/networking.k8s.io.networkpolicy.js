import SteveModel from '@shell/plugins/steve/steve-class';
import { relatedEntry, workloadsInNamespace } from '@shell/utils/editable-related-resources';

export default class NetworkPolicy extends SteveModel {
  /**
   * The resources related to this NetworkPolicy, to edit by YAML alongside it
   *
   * Dependencies: the workloads in its namespace whose pods `spec.podSelector` selects. Pods
   * matched only as peers of an `ingress` or `egress` rule are not included
   *
   * See https://kubernetes.io/docs/concepts/services-networking/network-policies/
   *
   * @param {import('@shell/core/types').EditableRelatedResourcesFetchOptions} [options]
   * @returns {Promise<import('@shell/core/types').EditableRelatedResource[]>}
   */
  async fetchOwnEditableRelatedResources({ dependencies = true } = {}) {
    if (!this.metadata?.uid || !dependencies) {
      return [];
    }

    const workloads = await workloadsInNamespace(this, this.metadata.namespace);

    return workloads
      .filter((workload) => workload.hasPodsSelectedBy(this.spec?.podSelector))
      .map((workload) => relatedEntry(workload));
  }
}
