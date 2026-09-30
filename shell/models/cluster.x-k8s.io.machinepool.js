import SteveModel from '@shell/plugins/steve/steve-class';
import { capiMachineSpecResources, relatedEntry } from '@shell/utils/editable-related-resources';

export default class CapiMachinePool extends SteveModel {
  /**
   * The resources related to this machine pool, to edit by YAML alongside it
   *
   * Dependencies: the bootstrap config and infrastructure machine pool named in
   * `spec.template.spec`, see `capiMachineSpecResources`
   *
   * @param {import('@shell/core/types').EditableRelatedResourcesFetchOptions} [options]
   * @returns {Promise<import('@shell/core/types').EditableRelatedResource[]>}
   */
  async fetchOwnEditableRelatedResources({ dependencies = true } = {}) {
    if (!this.metadata?.uid || !dependencies) {
      return [];
    }

    const resources = await capiMachineSpecResources(this, this.spec?.template?.spec, this.metadata.namespace);

    return resources.map((resource) => relatedEntry(resource));
  }
}
