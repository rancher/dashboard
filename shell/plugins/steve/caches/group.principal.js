import PrincipalCache from '@shell/plugins/steve/caches/principal';
import { calculatedFields } from '@shell/plugins/steve/resourceUtils/group.principal';

export default class GroupCache extends PrincipalCache {
  constructor(type, resourceRequest, cacheFieldGetters = {}) {
    super(type, resourceRequest, cacheFieldGetters);

    this.calculatedFields = [
      ...this.calculatedFields,
      ...calculatedFields
    ];
  }
}
