import { getProductFromRoute } from '@shell/utils/router';
import { NAME as EXPLORER } from '@shell/config/product/explorer';
import { RouteLocation } from 'vue-router';
import { Store } from 'vuex';

/**
 * Attempt to set the product in our datastore if the route matches a known product. Otherwise show an error page instead.
 */
export function setProduct(store: Store<any>, to: RouteLocation) {
  let product = getProductFromRoute(to);

  // since all products are hardcoded as routes (ex: c-local-explorer), if we match the wildcard route it means that the product does not exist
  if ((product && (!to.matched.length || (to.matched.length && to.matched[0].path === '/c/:cluster/:product'))) ||
  // if the product grabbed from the route is not registered, then we don't have it!
  (product && !store.getters['type-map/isProductRegistered'](product))) {
    const error = new Error(store.getters['i18n/t']('nav.failWhale.productNotFound', { productNotFound: product }, true));

    return store.dispatch('loadingError', error);
  }

  if ( !product ) {
    product = EXPLORER;
  }

  const oldProduct = store.getters['productId'];
  const oldStore = store.getters['currentProduct']?.inStore;

  if ( product !== oldProduct ) {
    store.commit('setProduct', product);
  }

  const neuStore = store.getters['currentProduct']?.inStore;

  if ( neuStore !== oldStore ) {
    // If the product store changes, clear the catalog.
    // There might be management catalog items in it vs cluster.
    store.commit('catalog/reset');
  }
}
