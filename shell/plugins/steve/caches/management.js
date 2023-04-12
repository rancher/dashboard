import ExternalCache from '@shell/plugins/steve/caches/externalCache';
export default class ManagementCache extends ExternalCache {
  load(data) {
    super.load(data);

    this.rootGetters['management/byId'] = (type, id) => this.resources?.types[type].list.find(({ id: resourceId } = {}) => resourceId === id);

    this.rootGetters['management/all'] = type => this.resources?.types[type];
  }
}
