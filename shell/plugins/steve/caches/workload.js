import WorkloadServiceCache from '@shell/plugins/steve/caches/workload.service';
import { calculatedFields } from '@shell/plugins/steve/resourceUtils/workload';

export default class WorkloadCache extends WorkloadServiceCache {
  constructor(type, getters, rootGetters, api, uiApi, createCache) {
    super(type, getters, rootGetters, api, uiApi, createCache);

    this.calculatedFields = [
      ...this.calculatedFields,
      ...calculatedFields
    ];
  }
}
