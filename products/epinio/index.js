
import { init as productInit } from '@/products/epinio/config/product/epinio';
import storeInit from '@/products/epinio/store/epinio-store';
import mgmtStoreInit from '@/products/epinio/store/epinio-mgmt-store';

let applied = false;

export default {
  product: (store) => {
    if (applied) {
      return;
    }

    applied = true;
    productInit(store);
  },
  stores: [
    mgmtStoreInit,
    storeInit
  ],

};
