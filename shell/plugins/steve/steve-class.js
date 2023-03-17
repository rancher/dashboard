import { DESCRIPTION } from '@shell/config/labels-annotations';
import HybridModel from './hybrid-class';
import { _getNamespace, _getName, _getDescription } from '@shell/plugins/steve/resourceUtils/steve-class';

export default class SteveModel extends HybridModel {
  get name() {
    return _getName(this);
  }

  get namespace() {
    return _getNamespace(this);
  }

  get description() {
    return _getDescription(this);
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
