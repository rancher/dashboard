import PrincipalCache from '@shell/plugins/steve/caches/principal';
import { calculatedFields } from '@shell/plugins/steve/resourceUtils/group.principal';

export default class GroupCache extends PrincipalCache {
  constructor(type, getters, rootGetters, api, uiApi, createCache) {
    super(type, getters, rootGetters, api, uiApi, createCache);

    this.calculatedFields = [
      ...this.calculatedFields,
      ...calculatedFields
    ];
  }
}
