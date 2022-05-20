import MachineTemplate from './rke-machine.cattle.io.machinetemplate';

export default class AzureMachineTemplate extends MachineTemplate {
  get provider() {
    return 'azure';
  }

  get providerLocation() {
    return this.spec.template.spec.location;
  }

  get providerSize() {
    return this.spec.template.spec.size;
  }
}
