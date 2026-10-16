import { setProduct } from '@shell/utils/product';
import { applyProducts } from '@shell/store/type-map';

export function install(router, context) {
  router.beforeEach((to, from, next) => loadProducts(to, from, next, context));
}

export async function loadProducts(to, from, next, { store }) {
  // GC should be notified of route change before any find/get request is made that might be used for that page
  store.dispatch('gcRouteChanged', to);

  const lateRoutesAdded = store.$extension?.lateRoutesAdded;

  await applyProducts(store, store.$extension);

  // Applying the products can add routes - for an extension extending a product registered after
  // it loaded - and vue-router matched `to` before they existed. Navigate to it again so it can
  // match one of them.
  if (store.$extension?.lateRoutesAdded !== lateRoutesAdded) {
    return next(to.fullPath);
  }

  setProduct(store, to);
  next();
}
