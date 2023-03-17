import SteveModel from '@shell/plugins/steve/steve-class';
import { _getNameDisplay } from '@shell/plugins/steve/resourceUtils/rke-machine.cattle.io.machinetemplate';

export default class MachineTemplate extends SteveModel {
  get nameDisplay() {
    return _getNameDisplay(this);
  }

  get provider() {
    // Override in your child class
    return null;
  }

  get providerLocation() {
    // Override in your child class
    return null;
  }

  get providerSize() {
    // Override in your child class
    return null;
  }
}
