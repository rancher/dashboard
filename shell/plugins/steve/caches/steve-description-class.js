import SteveCache from '@shell/plugins/steve/caches/steve-class';
import { calculatedFields } from '@shell/plugins/steve/resourceUtils/steve-description-class';

export default class SteveDescriptionCache extends SteveCache {
  constructor(type, resourceRequest, cacheFieldGetters = {}) {
    super(type, resourceRequest, cacheFieldGetters);

    this.calculatedFields = [
      ...this.calculatedFields,
      ...calculatedFields
    ];
  }
}
