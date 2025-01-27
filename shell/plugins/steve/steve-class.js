import { DESCRIPTION } from '@shell/config/labels-annotations';
import HybridModel from './hybrid-class';
import { NEVER_ADD } from '@shell/utils/create-yaml';
import { deleteProperty } from '@shell/utils/object';
import { EXT_IDS } from '@shell/core/plugin';

// Some fields that are removed for YAML (NEVER_ADD) are required via API
const STEVE_ADD = [
  'metadata.resourceVersion',
  'metadata.fields',
  'metadata.clusterName',
  'metadata.deletionGracePeriodSeconds',
  'metadata.generateName',
];
const STEVE_NEVER_SAVE = NEVER_ADD.filter((na) => !STEVE_ADD.includes(na));

export default class SteveModel extends HybridModel {
  get name() {
    return this.metadata?.name || this._name;
  }

  get namespace() {
    return this.metadata?.namespace;
  }

  get description() {
    return this.metadata?.annotations?.[DESCRIPTION] || this.spec?.description || this._description;
  }

  /**
   * Set description based on the type of model available with private fallback
   */
  set description(value) {
    if (this.metadata?.annotations) {
      this.metadata.annotations[DESCRIPTION] = value;
    }

    if (this.spec) {
      this.spec.description = value;
    }

    this._description = value;
  }

  /**
   * Get all model extensions for this model
   */
  get modelExtensions() {
    return this.$plugin.getDynamic(EXT_IDS.MODEL_EXTENSION, this.type) || [];
  }

  cleanForSave(data, forNew) {
    const val = super.cleanForSave(data);

    for (const field of STEVE_NEVER_SAVE) {
      deleteProperty(val, field);
    }

    return val;
  }
}
