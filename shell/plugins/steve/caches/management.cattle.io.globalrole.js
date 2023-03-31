import SteveDescriptionCache from '@shell/plugins/steve/caches/steve-description-class';
import { calculatedFields } from '@shell/plugins/steve/resourceUtils/management.cattle.io.globalrole';

export default class GlobalRoleCache extends SteveDescriptionCache {
  constructor(type, getters, rootGetters, api, uiApi, createCache) {
    super(type, getters, rootGetters, api, uiApi, createCache);

    this.calculatedFields = [
      ...this.calculatedFields,
      ...calculatedFields
    ];
  }
}
