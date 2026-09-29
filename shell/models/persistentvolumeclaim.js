
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
import { PV, PVC as PVC_TYPE, STORAGE_CLASS, VOLUME_ATTRIBUTES_CLASS } from '@shell/config/types';
import { findIfExists, relatedEntry, workloadsInNamespace } from '@shell/utils/editable-related-resources';

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
   * Dependencies: its PersistentVolume, StorageClass and VolumeAttributesClass
   *
   * Dependents: the workloads in its namespace whose pods use it, see the workload model's
   * `usesResource`
   *
   * @param {import('@shell/core/types').EditableRelatedResourcesFetchOptions} [options]
   * @returns {Promise<import('@shell/core/types').EditableRelatedResource[]>}
   */
  async fetchOwnEditableRelatedResources({ dependencies = true, dependents = true } = {}) {
    if (!this.metadata?.uid) {
      return [];
    }

    const [volume, storageClass, attributesClass, workloads] = await Promise.all([
      dependencies ? findIfExists(this, PV, this.spec?.volumeName) : null,
      dependencies ? findIfExists(this, STORAGE_CLASS, this.spec?.storageClassName) : null,
      dependencies ? findIfExists(this, VOLUME_ATTRIBUTES_CLASS, this.spec?.volumeAttributesClassName) : null,
      dependents ? workloadsInNamespace(this, this.metadata.namespace) : [],
    ]);

    const sharedBanner = (resource) => () => ({ color: 'warning', label: this.t('resourceYaml.resourceGraph.banners.sharedByClaims', { type: resource.typeDisplay }) });

    return [
      ...(volume ? [relatedEntry(volume)] : []),
      ...[storageClass, attributesClass].filter(Boolean).map((resource) => relatedEntry(resource, { banner: sharedBanner(resource) })),
      ...workloads.filter((workload) => workload.usesResource(PVC_TYPE, this.metadata.name)).map((workload) => relatedEntry(workload, { dependent: true })),
    ];
  }
}
