import ExternalCache from '@shell/plugins/steve/caches/externalCache';

export default class ClusterCache extends ExternalCache {
  load(data) {
    super.load(data);

    this.rootGetters['cluster/pathExistsInSchema'] = (typeParam, path) => this.getters.caches['schema'].pathExistsInSchema(typeParam, path);
  }
}
