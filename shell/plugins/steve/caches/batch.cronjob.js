import WorkloadCache from '@shell/plugins/steve/caches/workload';
import { calculatedFields } from '@shell/plugins/steve/resourceUtils/batch.cronjob';

export default class CronJobCache extends WorkloadCache {
  constructor(type, getters, rootGetters, api, uiApi, createCache) {
    super(type, getters, rootGetters, api, uiApi, createCache);

    this.calculatedFields = [
      ...this.calculatedFields,
      ...calculatedFields
    ];
  }
}
