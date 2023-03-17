import SteveModel from '@shell/plugins/steve/steve-class';
import { _getKeysDisplay } from '@shell/plugins/steve/resourceUtils/configmap';

export default class ConfigMap extends SteveModel {
  get keysDisplay() {
    return _getKeysDisplay(this);
  }
}
