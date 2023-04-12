import ExternalCache from '@shell/plugins/steve/caches/externalCache';
import { chart, charts, repos } from '@shell/utils/catalog.cattle.io.app';
export default class CatalogCache extends ExternalCache {
  load(data) {
    super.load(data);

    this.rootGetters['catalog/chart'] = () => {
      const catalogGetters = { repos: repos(this.resources) };

      return chart(charts(this.resources, catalogGetters, this.rootGetters));
    };
  }
}
