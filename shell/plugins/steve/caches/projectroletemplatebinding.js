import HybridModel from '@shell/plugins/steve/caches/hybrid-class';
import { calculatedFields } from '@shell/plugins/steve/resourceUtils/projectroletemplatebinding';

export default class PRTBCache extends HybridModel {
  constructor(type, getters, rootGetters, api, uiApi, createCache) {
    super(type, getters, rootGetters, api, uiApi, createCache);

    this.calculatedFields = [
      ...this.calculatedFields,
      ...calculatedFields
    ];
  }
}
