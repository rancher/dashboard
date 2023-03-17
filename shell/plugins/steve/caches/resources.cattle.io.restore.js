import SteveCache from '@shell/plugins/steve/caches/steve-class';
import { calculatedFields } from '@shell/plugins/steve/resourceUtils/resources.cattle.io.restore';

export default class Restore extends SteveCache {
  constructor(type, resourceRequest, cacheFieldGetters = {}) {
    super(type, resourceRequest, cacheFieldGetters);

    this.calculatedFields = [
      ...this.calculatedFields,
      ...calculatedFields
    ];
  }
}
