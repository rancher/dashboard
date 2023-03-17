import WorkloadServiceCache from '@shell/plugins/steve/caches/workload.service';
import { calculatedFields } from '@shell/plugins/steve/resourceUtils/pod';

export default class PodCache extends WorkloadServiceCache {
  constructor(type, resourceRequest, cacheFieldGetters = {}) {
    super(type, resourceRequest, cacheFieldGetters);

    this.calculatedFields = [
      ...this.calculatedFields,
      ...calculatedFields
    ];
  }
}
