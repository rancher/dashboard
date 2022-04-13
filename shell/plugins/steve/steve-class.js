import { DESCRIPTION } from '@shell/config/labels-annotations';
import HybridModel from './hybrid-class';

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
}
