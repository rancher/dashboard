import ExternalCache from '@shell/plugins/steve/caches/externalCache';
export default class RancherCache extends ExternalCache {
  load(data) {
    super.load(data);

    this.rootGetters['rancher/byId'] = (type, id) => this.resources?.types[type].list.find(({ id: resourceId } = {}) => resourceId === id);
  }
}
