import { NAME as EXPLORER } from '@shell/config/product/explorer';

export function queryParamsFor(current, qp, defaults = {}) {
  const query = Object.assign({}, current || {});

  for ( const key of Object.keys(qp) ) {
    const val = qp[key];

    if ( typeof defaults[key] === 'undefined' ) {
      // There is no default
      query[key] = qp[key];
    } else if ( defaults[key] === false ) {
      // Value-less boolean flags
      if ( val ) {
        query[key] = null;
      } else {
        delete query[key];
      }
    } else if ( val === defaults[key] ) {
      // The value is the default
      delete query[key];
    } else {
      // The value is not the default
      query[key] = val;
    }
  }

  return query;
}

export const getPackageFromRoute = (route) => {
  if (!route?.meta) {
    return;
  }
  // Sometimes meta is an array... sometimes not
  const arraySafe = Array.isArray(route.meta) ? route.meta : [route.meta];

  return arraySafe.find(m => !!m.pkg)?.pkg;
};

function findMeta(route, key) {
  if (route?.meta) {
    const meta = Array.isArray(route.meta) ? route.meta : [route.meta];

    for (let i = 0; i < meta.length; i++) {
      if (meta[i][key]) {
        return meta[i][key];
      }
    }
  }

  return undefined;
}

export function getClusterFromRoute(to) {
  let cluster = to.params?.cluster;

  if (!cluster) {
    cluster = findMeta(to, 'cluster');
  }

  return cluster;
}

export function getProductFromRoute(to) {
  let product = to.params?.product;

  if ( !product ) {
    const match = to.name?.match(/^c-cluster-([^-]+)/);

    if ( match ) {
      product = match[1];
    }
  }

  // If still no product, see if the route indicates the product via route metadata
  if (!product) {
    product = findMeta(to, 'product');
  }

  return product;
}

export function setProduct(store, to) {
  let product = getProductFromRoute(to);

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
