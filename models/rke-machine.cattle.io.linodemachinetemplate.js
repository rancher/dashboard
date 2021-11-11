import SteveModel from '@/plugins/steve/steve-class';

export default class LinodeMachineTemplate extends SteveModel {
  get nameDisplay() {
    return this.name.replace(`${ this.metadata.annotations['objectset.rio.cattle.io/owner-name'] }-`, '');
  }

  get provider() {
    return 'linode';
  }

  get providerLocation() {
    return this.spec.template.spec.region ;
  }

  get providerSize() {
    return this.spec.template.spec.instanceType;
  }
}
