import WorkloadCache from '@shell/plugins/steve/caches/workload';
import { calculatedFields } from '@shell/plugins/steve/resourceUtils/batch.job';

export default class JobCache extends WorkloadCache {
  constructor(type, getters, rootGetters, api, uiApi, createCache) {
    super(type, getters, rootGetters, api, uiApi, createCache);

    this.calculatedFields = [
      ...this.calculatedFields,
      ...calculatedFields
    ];
  }
}
