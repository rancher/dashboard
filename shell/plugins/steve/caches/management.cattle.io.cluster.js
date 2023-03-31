import HybridModel from '@shell/plugins/steve/caches/hybrid-class';
import { calculatedFields } from '@shell/plugins/steve/resourceUtils/management.cattle.io.cluster';

export default class MgmtClusterCache extends HybridModel {
  constructor(type, getters, rootGetters, api, uiApi, createCache) {
    super(type, getters, rootGetters, api, uiApi, createCache);

    this.calculatedFields = [
      ...this.calculatedFields,
      ...calculatedFields
    ];
  }
}
