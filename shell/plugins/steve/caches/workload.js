import WorkloadServiceCache from '@shell/plugins/steve/caches/workload.service';
import { calculatedFields } from '@shell/plugins/steve/resourceUtils/workload';

export default class WorkloadCache extends WorkloadServiceCache {
  constructor(type, resourceRequest, cacheFieldGetters = {}) {
    super(type, resourceRequest, cacheFieldGetters);

    this.calculatedFields = [
      ...this.calculatedFields,
      ...calculatedFields
    ];
  }
}
