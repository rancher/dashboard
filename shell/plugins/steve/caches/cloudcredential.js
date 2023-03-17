import HybridModel from '@shell/plugins/steve/caches/hybrid-class';
import { calculatedFields } from '@shell/plugins/steve/resourceUtils/cloudcredential';

export default class CloudCredentialCache extends HybridModel {
  constructor(type, resourceRequest, cacheFieldGetters = {}) {
    super(type, resourceRequest, cacheFieldGetters);

    this.calculatedFields = [
      ...this.calculatedFields,
      ...calculatedFields
    ];
  }
}
