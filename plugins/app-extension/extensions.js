import { EPINIO_PRODUCT_NAME } from '@/plugins/app-extension/epinio/types';
import epinio from './epinio/index';

// Note - Extensions need to be directly imported here rather than importing this file and applying themselves to this file
// (extensions are required by `store/index`, which executes after anything imported here)
const extensions = { [EPINIO_PRODUCT_NAME]: epinio };

export default {

  applyProducts(store) {
    return Object.values(extensions).forEach(ext => ext.product(store));
  },

  createStores() {
    return [].concat.apply([], Object.values(extensions).map(ext => ext.store()));
  },

  stores() {
    return Object.keys(extensions);
  }

};
