import LogFlowCache from '@shell/plugins/steve/caches/logging.banzaicloud.io.flow';
import { calculatedFields } from '@shell/plugins/steve/resourceUtils/logging.banzaicloud.io.clusterflow';

export default class LogClusterFlowCache extends LogFlowCache {
  constructor(type, getters, rootGetters, api, uiApi, createCache) {
    super(type, getters, rootGetters, api, uiApi, createCache);

    this.calculatedFields = [
      ...this.calculatedFields,
      ...calculatedFields
    ];
  }
}
