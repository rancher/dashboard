import MachineTemplate from './rke-machine.cattle.io.machinetemplate';

export default class PnapMachineTemplate extends MachineTemplate {
  get provider() {
    return 'pnap';
  }

  get providerLocation() {
    return this.spec.template.spec.serverLocation;
  }

  get providerSize() {
    return this.spec.template.spec.serverType;
  }
}
