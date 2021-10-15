import SteveModel from '@/plugins/steve/steve-class';

export default class Amazonec2MachineTemplate extends SteveModel {
  get nameDisplay() {
    return this.name.replace(`${ this.metadata.annotations['objectset.rio.cattle.io/owner-name'] }-`, '');
  }

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
