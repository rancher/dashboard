import HybridModel from '@shell/plugins/steve/caches/hybrid-class';
import { calculatedFields } from '@shell/plugins/steve/resourceUtils/management.cattle.io.nodepool';

export default class MgmtNodePoolCache extends HybridModel {
  constructor(type, getters, rootGetters, api, uiApi, createCache) {
    super(type, getters, rootGetters, api, uiApi, createCache);

    this.calculatedFields = [
      ...this.calculatedFields,
      ...calculatedFields
    ];
  }
}
