import SteveCache from '@shell/plugins/steve/caches/steve-class';
import { calculatedFields } from '@shell/plugins/steve/resourceUtils/configmap';

export default class ConfigMapCache extends SteveCache {
  constructor(type, getters, rootGetters, api, uiApi, createCache) {
    super(type, getters, rootGetters, api, uiApi, createCache);

    this.calculatedFields = [
      ...this.calculatedFields,
      ...calculatedFields
    ];
  }
}
