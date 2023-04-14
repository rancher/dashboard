import SteveModel from '@shell/plugins/steve/steve-class';
import { fields } from '@shell/plugins/steve/resourceUtils/configmap';

export default class ConfigMap extends SteveModel {
  get keysDisplay() {
    return fields.keysDisplay(this);
  }
}
