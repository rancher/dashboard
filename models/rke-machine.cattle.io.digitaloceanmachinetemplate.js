import MachineTemplate from './rke-machine.cattle.io.machinetemplate';

export default class DigialoceanMachineTemplate extends MachineTemplate {
  get provider() {
    return 'digitalocean';
  }

  get providerLocation() {
    return this.spec.template.spec.region;
  }

  get providerSize() {
    return this.spec.template.spec.size;
  }
}
