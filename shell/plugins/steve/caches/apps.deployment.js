import WorkloadCache from '@shell/plugins/steve/caches/workload';
import { calculatedFields } from '@shell/plugins/steve/resourceUtils/workload';
export default class DeploymentCache extends WorkloadCache {
  constructor(type, resourceRequest, cacheFieldGetters = {}) {
    super(type, resourceRequest, cacheFieldGetters);

    this.calculatedFields = [
      ...this.calculatedFields,
      ...calculatedFields
    ];
  }
}
