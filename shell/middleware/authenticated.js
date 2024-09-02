import { DEFAULT_WORKSPACE } from '@shell/config/types';
import { applyProducts } from '@shell/store/type-map';
import { ClusterNotFoundError, RedirectToError } from '@shell/utils/error';
import { get } from '@shell/utils/object';
import { AFTER_LOGIN_ROUTE, WORKSPACE } from '@shell/store/prefs';
import { BACK_TO } from '@shell/config/local-storage';
import { NAME as FLEET_NAME } from '@shell/config/product/fleet.js';
import { validateResource, setProduct } from '@shell/utils/auth';
import { getClusterFromRoute, getProductFromRoute, getPackageFromRoute } from '@shell/utils/router';

let beforeEachSetup = false;

export default async function({
  route, store, redirect, from, $plugin, next
}) {
  if ( store.getters['auth/enabled'] !== false && !store.getters['auth/loggedIn'] ) {
    return;
  }

  const backTo = window.localStorage.getItem(BACK_TO);

  if (backTo) {
    window.localStorage.removeItem(BACK_TO);

    window.location.href = backTo;
  }

  // GC should be notified of route change before any find/get request is made that might be used for that page
  store.dispatch('gcRouteChanged', route);

  // Load stuff
  let localCheckResource = false;

  await applyProducts(store, $plugin);

  // Setup a beforeEach hook once to keep track of the current product
  if ( !beforeEachSetup ) {
    beforeEachSetup = true;
    // This only needs to happen when beforeEach hook hasn't run (the initial load)
    localCheckResource = true;

    store.app.router.beforeEach((to, from, next) => {
      // NOTE - This beforeEach runs AFTER this middleware. So anything in this middleware that requires it must set it manually
      setProduct(store, to);

      next();
    });

    // Call it for the initial pageload
    setProduct(store, route);

    store.app.router.afterEach((to, from) => {
      // Clear state used to record if back button was used for navigation
      setTimeout(() => {
        window._popStateDetected = false;
      }, 1);
    });
  }

  try {
    let clusterId = get(route, 'params.cluster');

    // Route can provide cluster ID via metadata
    if (!clusterId && route) {
      clusterId = getClusterFromRoute(route);
    }

    const pkg = getPackageFromRoute(route);
    const product = getProductFromRoute(route);

    const oldPkg = getPackageFromRoute(from);
    const oldProduct = getProductFromRoute(from);

    // Leave an old pkg where we weren't before?
    const oldPkgPlugin = oldPkg ? Object.values($plugin.getPlugins()).find((p) => p.name === oldPkg) : null;

    if (oldPkg && oldPkg !== pkg ) {
      // Execute anything optional the plugin wants to. For example resetting it's store to remove data
      await oldPkgPlugin.onLeave(store, {
        clusterId,
        product,
        oldProduct,
        oldIsExt: !!oldPkg
      });
    }

    // Sometimes this needs to happen before or alongside other things... but is always needed
    const always = [
      store.dispatch('loadManagement')
    ];

    // Entering a new package where we weren't before?
    const newPkgPlugin = pkg ? Object.values($plugin.getPlugins()).find((p) => p.name === pkg) : null;

    // Note - We can't block on oldPkg !== newPkg because on a fresh load the `from` route equals the `to` route
    if (pkg && (oldPkg !== pkg || from.fullPath === route.fullPath)) {
      // Execute mandatory store actions
      await Promise.all(always);

      // Execute anything optional the plugin wants to
      await newPkgPlugin.onEnter(store, {
        clusterId,
        product,
        oldProduct,
        oldIsExt: !!oldPkg
      });
    }

    // Ensure that the activeNamespaceCache is updated given the change of context either from or to a place where it uses workspaces
    // When fleet moves to it's own package this should be moved to pkg onEnter/onLeave
    if ((oldProduct === FLEET_NAME || product === FLEET_NAME) && oldProduct !== product) {
      // See note above for store.app.router.beforeEach, need to setProduct manually, for the moment do this in a targeted way
      setProduct(store, route);

      store.commit('updateWorkspace', {
        value:   store.getters['prefs/get'](WORKSPACE) || DEFAULT_WORKSPACE,
        getters: store.getters
      });
    }

    // Always run loadCluster, it handles 'unload' as well
    // Run them in parallel
    await Promise.all([
      ...always,
      store.dispatch('loadCluster', {
        id:          clusterId,
        oldPkg:      oldPkgPlugin,
        newPkg:      newPkgPlugin,
        product,
        oldProduct,
        targetRoute: route
      })
    ]);

    if (localCheckResource) {
      validateResource(store, route, redirect);
    }

    if (!clusterId) {
      clusterId = store.getters['defaultClusterId']; // This needs the cluster list, so no parallel
      const isSingleProduct = store.getters['isSingleProduct'];

      if (isSingleProduct?.afterLoginRoute) {
        const value = {
          name:   'c-cluster-product',
          ...isSingleProduct.afterLoginRoute,
          params: {
            cluster: clusterId,
            ...isSingleProduct.afterLoginRoute?.params
          },
        };

        await store.dispatch('prefs/set', {
          key: AFTER_LOGIN_ROUTE,
          value,
        });
      }
    }
  } catch (e) {
    if ( e.name === ClusterNotFoundError.name ) {
      return redirect(302, '/home');
    } if ( e.name === RedirectToError.name ) {
      return redirect(302, e.url);
    } else {
      // Sets error 500 if lost connection to API
      store.commit('setError', { error: e, locationError: new Error(store.getters['i18n/t']('nav.failWhale.authMiddleware')) });

      return redirect(302, '/fail-whale');
    }
  }
}
