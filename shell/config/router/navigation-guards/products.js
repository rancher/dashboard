import { setProduct } from '@shell/utils/auth';
import { applyProducts } from '@shell/store/type-map';

export function install(router, context) {
  router.beforeEach((to, from, next) => loadProducts(to, from, next, context));
}

export async function loadProducts(to, from, next, { store }) {
  // GC should be notified of route change before any find/get request is made that might be used for that page
  store.dispatch('gcRouteChanged', to);

  await applyProducts(store, store.$plugin);
  setProduct(store, to);
  next();
}
