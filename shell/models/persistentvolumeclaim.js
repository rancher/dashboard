
import { insertAt } from '@shell/utils/array';
import {
  AS,
  _CLONE,
  FOCUS,
  MODE,
  _UNFLAG,
  _EDIT
} from '@shell/config/query-params';
import SteveModel from '@shell/plugins/steve/steve-class';
import { STATES_ENUM } from '@shell/plugins/dashboard-store/resource-class';
import { PVC as PVC_TYPE, STORAGE_CLASS } from '@shell/config/types';
import { relatedEntry, workloadsInNamespace } from '@shell/utils/related-resources';

export default class PVC extends SteveModel {
  applyDefaults(_, realMode) {
    const accessModes = realMode === _CLONE ? this.spec.accessModes : [];
    const storage = realMode === _CLONE ? this.spec.resources.requests.storage : null;

    this['spec'] = {
      accessModes,
      storageClassName: '',
      volumeName:       '',
      resources:        { requests: { storage } }
    };
  }

  get bound() {
    return this.state === STATES_ENUM.BOUND;
  }

  get expandable() {
    return !!this.$getters[`byId`](STORAGE_CLASS, this.spec?.storageClassName)?.allowVolumeExpansion;
  }

  get _availableActions() {
    const out = super._availableActions;

    // Add backwards, each one to the top
    insertAt(out, 0, { divider: true });
    insertAt(out, 0, {
      action:  'goToEditVolumeSize',
      enabled: this.expandable && this.bound,
      icon:    'icon icon-plus',
      label:   this.t('persistentVolumeClaim.expand.label'),
    });

    return out;
  }

  goToEditVolumeSize() {
    const location = this.detailLocation;

    location.query = {
      ...location.query,
      [MODE]:  _EDIT,
      [AS]:    _UNFLAG,
      [FOCUS]: 'volumeclaim'
    };

    this.currentRouter().push(location);
  }

  /**
   * The resources related to this claim, to edit by YAML alongside it
   *
   * Dependents: the workloads in its namespace whose pods use it, see the workload model's
   * `usesResource`
   *
   * The PersistentVolume, StorageClass and VolumeAttributesClass are found from the schema, see
   * `fetchSchemaRelatedResources`
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
      .filter((workload) => workload.usesResource(PVC_TYPE, this.metadata.name))
      .map((workload) => relatedEntry(workload, { dependent: true }));
  }
}
