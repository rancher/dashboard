import MachineTemplate from './rke-machine.cattle.io.machinetemplate';

export default class LinodeMachineTemplate extends MachineTemplate {
  get provider() {
    return 'linode';
  }

  get providerLocation() {
    return this.spec.template.spec.region;
  }

  get providerSize() {
    return this.spec.template.spec.instanceType;
  }
}
