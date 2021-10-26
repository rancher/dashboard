import SteveModel from '@/plugins/steve/steve-class';

export default class AzureMachineTemplate extends SteveModel {
  get nameDisplay() {
    return this.name.replace(`${ this.metadata.annotations['objectset.rio.cattle.io/owner-name'] }-`, '');
  }

  get provider() {
    return 'azure';
  }

  get providerLocation() {
    return this.spec.template.spec.location ;
  }

  get providerSize() {
    return this.spec.template.spec.size;
  }
}
