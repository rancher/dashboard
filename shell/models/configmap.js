import SteveModel from '@shell/plugins/steve/steve-class';
import { CONFIG_MAP } from '@shell/config/types';
import { relatedEntry, workloadsInNamespace } from '@shell/utils/editable-related-resources';

export default class ConfigMap extends SteveModel {
  /**
   * The resources related to this ConfigMap, to edit by YAML alongside it
   *
   * Dependents: the workloads in its namespace whose pods use it, see the workload model's
   * `usesResource`
   *
   * @param {import('@shell/core/types').EditableRelatedResourcesFetchOptions} [options]
   * @returns {Promise<import('@shell/core/types').EditableRelatedResource[]>}
   */
  async fetchOwnEditableRelatedResources({ dependents = true } = {}) {
    if (!this.metadata?.uid || !dependents) {
      return [];
    }

    const workloads = await workloadsInNamespace(this, this.metadata.namespace);

    return workloads
      .filter((workload) => workload.usesResource(CONFIG_MAP, this.metadata.name))
      .map((workload) => relatedEntry(workload, { dependent: true }));
  }

  get keysDisplay() {
    const keys = [
      ...Object.keys(this.data || []),
      ...Object.keys(this.binaryData || [])
    ];

    if ( !keys.length ) {
      return '(none)';
    }

    // if ( keys.length >= 4 ) {
    //   return `${keys[0]}, ${keys[1]}, ${keys[2]} and ${keys.length - 3} more`;
    // }

    return keys.join(', ');
  }

  get fullDetailPageOverride() {
    return true;
  }
}
