import SteveModel from '@shell/plugins/steve/steve-class';
import { relatedEntry, workloadsInNamespace } from '@shell/utils/editable-related-resources';

export default class PodDisruptionBudget extends SteveModel {
  /**
   * The resources related to this PodDisruptionBudget, to edit by YAML alongside it
   *
   * Dependencies: the workloads in its namespace whose pods `spec.selector` selects
   *
   * See https://kubernetes.io/docs/concepts/workloads/pods/disruptions/
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
      .filter((workload) => workload.hasPodsSelectedBy(this.spec?.selector))
      .map((workload) => relatedEntry(workload));
  }
}
