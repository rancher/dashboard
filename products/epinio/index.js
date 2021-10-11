
import { init as productInit } from '@/products/epinio/config/product/epinio';
import storeInit from '@/products/epinio/store';

import { EPINIO_PRODUCT_NAME, EPINIO_TYPES } from '@/products/epinio/types';

let applied = false;

export default {
  product: (store) => {
    if (applied) {
      return;
    }

    applied = true;
    productInit(store);

    // This is our own resource type, not from api
    store.dispatch(`${ EPINIO_PRODUCT_NAME }/loadAll`, {
      type:     EPINIO_TYPES.INSTANCE,
      data: [{
        name:     'epinio_cluster_id',
        api:      process.env.epinioUrl,
        username: process.env.epinioUser,
        password: process.env.epinioPassword,
        type:     EPINIO_TYPES.INSTANCE
      }]
    });

    // Rancher schemas are user dependent so are loaded on auth via `loadManagement`
    // For epinio we create mock schemas (that power all the generic components)
    // At some point schemas will need to reflect user privileges, but not at the moment
    store.dispatch(`${ EPINIO_PRODUCT_NAME }/loadSchemas`);
  },
  store: storeInit,

};
