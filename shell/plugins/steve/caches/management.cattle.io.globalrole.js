import SteveDescriptionCache from '@shell/plugins/steve/caches/steve-description-class';
import { calculatedFields } from '@shell/plugins/steve/resourceUtils/management.cattle.io.globalrole';

export default class GlobalRoleCache extends SteveDescriptionCache {
  constructor(type, resourceRequest, cacheFieldGetters = {}) {
    super(type, resourceRequest, cacheFieldGetters);

    this.calculatedFields = [
      ...this.calculatedFields,
      ...calculatedFields
    ];
  }
}
