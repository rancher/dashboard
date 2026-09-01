import MachineTemplate from './rke-machine.cattle.io.machinetemplate';

export default class Amazonec2MachineTemplate extends MachineTemplate {
  get provider() {
    return 'amazonec2';
  }

  get providerLocation() {
    return `${ this.spec.template.spec.region }${ this.spec.template.spec.zone }`;
  }

  get providerSize() {
    return this.spec.template.spec.instanceType;
  }
}
