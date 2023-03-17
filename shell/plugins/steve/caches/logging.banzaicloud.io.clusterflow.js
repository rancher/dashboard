import LogFlowCache from '@shell/plugins/steve/caches/logging.banzaicloud.io.flow';
import { calculatedFields } from '@shell/plugins/steve/resourceUtils/logging.banzaicloud.io.clusterflow';

export default class LogClusterFlowCache extends LogFlowCache {
  constructor(type, resourceRequest, cacheFieldGetters = {}) {
    super(type, resourceRequest, cacheFieldGetters);

    this.calculatedFields = [
      ...this.calculatedFields,
      ...calculatedFields
    ];
  }
}
