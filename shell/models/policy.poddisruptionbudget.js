import SteveModel from '@shell/plugins/steve/steve-class';
import { relatedEntry, workloadsInNamespace } from '@shell/utils/related-resources';

export default class PodDisruptionBudget extends SteveModel {
  /**
   * Related resources to show in the yaml editor
   * Found here, as dependents so the tree does not take in the resources they use:
   * - the workloads in its namespace whose pods it selects - `spec.selector`
   *
   * See https://kubernetes.io/docs/concepts/workloads/pods/disruptions/
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
      .filter((workload) => workload.hasPodsSelectedBy(this.spec?.selector))
      .map((workload) => relatedEntry(workload, { dependent: true }));
  }
}
