import Resource from '@shell/plugins/dashboard-store/resource-class';

export default class Schema extends Resource {
  get groupName() {
    return this.attributes.namespaced ? 'ns' : 'cluster';
  }
}
