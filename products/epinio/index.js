
import { init as productInit } from '@/products/epinio/config/product/epinio';
import storeInit from '@/products/epinio/store';

import { EPINIO_PRODUCT_NAME } from '@/products/epinio/types';

let applied = false;

export default {
  product: (store) => {
    if (applied) {
      return;
    }

    applied = true;
    productInit(store);

    // Rancher schemas are user dependent so are loaded on auth via `loadManagement`
    // For epinio we create mock schemas (that power all the generic components)
    // At some point schemas will need to reflect user privileges, but not at the moment
    store.dispatch(`${ EPINIO_PRODUCT_NAME }/loadSchemas`);
  },
  store: storeInit,

};
