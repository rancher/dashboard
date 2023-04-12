import ExternalCache from '@shell/plugins/steve/caches/externalCache';
import { MANAGEMENT } from '~/shell/config/types';
export default class RootCache extends ExternalCache {
  load(data) {
    super.load(data);

    this.rootGetters['isRancher'] = this.resources.isRancher === true;
    this.rootGetters['currentCluster'] = this.rootGetters['management/byId'](MANAGEMENT.CLUSTER, this.resources.clusterId);
    this.rootGetters['clusterId'] = this.resources.clusterId;
  }
}
