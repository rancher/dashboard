import SteveCache from '@shell/plugins/steve/caches/steve-class';
import { calculatedFields } from '@shell/plugins/steve/resourceUtils/workload.service';

// const calculatedFields2 = Object.entries(calculatedFields).map(([name, func]) => ({ name, func }));

export default class WorkloadServiceCache extends SteveCache {
  constructor(type, getters, rootGetters, api, uiApi, createCache) {
    super(type, getters, rootGetters, api, uiApi, createCache);
    // constructor(type, resourceRequest, cacheFieldGetters = {}) {
    //   super(type, resourceRequest, cacheFieldGetters, ['workload.service']);

    //   // dynamic import workload.service.
    //   // same file name
    //   // ... model
    //   // ... resourceUtil

    // TODO: RC these can be pushed down to stack to ResourceCache
    this.calculatedFields = [
      ...this.calculatedFields,
      ...calculatedFields
    ];
  }
}
