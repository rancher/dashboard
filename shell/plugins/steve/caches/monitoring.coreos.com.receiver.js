import SteveCache from '@shell/plugins/steve/caches/steve-class';
import { calculatedFields } from '@shell/plugins/steve/resourceUtils/monitoring.coreos.com.receiver';

export default class ReceiverCache extends SteveCache {
  constructor(type, getters, rootGetters, api, uiApi, createCache) {
    super(type, getters, rootGetters, api, uiApi, createCache);

    this.calculatedFields = [
      ...this.calculatedFields,
      ...calculatedFields
    ];
  }
}
