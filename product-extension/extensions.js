import { EPINIO_PRODUCT_NAME } from '@/products/epinio/types';
import epinio from '@/products/epinio/index';

// Note - Extensions need to be directly imported here rather than importing this file and applying themselves to this file
// (extensions are required by `store/index`, which executes after anything imported here)
const extensions = { [EPINIO_PRODUCT_NAME]: epinio };

export default {

  applyProducts(store) {
    return Object.values(extensions).forEach(ext => ext.product(store));
  },

  createStores() {
    return Object.values(extensions).reduce((r, ext) => r.concat(...ext.stores.map(s => s())), []);
  },

  stores() {
    return Object.keys(extensions);
  }

};
