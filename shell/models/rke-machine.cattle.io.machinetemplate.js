import SteveModel from '@shell/plugins/steve/steve-class';

export default class MachineTemplate extends SteveModel {
  get nameDisplay() {
    return this.name.replace(`${ this.metadata.annotations['objectset.rio.cattle.io/owner-name'] }-`, '');
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
