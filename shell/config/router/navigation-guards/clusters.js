import { DEFAULT_WORKSPACE } from '@shell/config/types';
import { ClusterNotFoundError, RedirectToError } from '@shell/utils/error';
import { get } from '@shell/utils/object';
import { AFTER_LOGIN_ROUTE, WORKSPACE } from '@shell/store/prefs';
import { NAME as FLEET_NAME } from '@shell/config/product/fleet.js';
import { validateResource, setProduct } from '@shell/utils/auth';
import { getClusterFromRoute, getProductFromRoute, getPackageFromRoute, routeRequiresAuthentication } from '@shell/utils/router';

export function install(router, context) {
  router.beforeEach((to, from, next) => loadClusters(to, from, next, context));
}

export async function loadClusters(to, from, next, { store }) {
  if (!routeRequiresAuthentication(to)) {
    return next();
  }

  try {
    let clusterId = get(to, 'params.cluster');

    // Route can provide cluster ID via metadata
    if (!clusterId && to) {
      clusterId = getClusterFromRoute(to);
    }

    const pkg = getPackageFromRoute(to);
    const product = getProductFromRoute(to);

    const oldPkg = getPackageFromRoute(from);
    const oldProduct = getProductFromRoute(from);

    // TODO: Replace all references to store.$plugin.
    //       Unfortunately the initialization code has circular dependencies between creating
    //       the router and creating the store that will need to be untangled before this can be tackled.

    // Leave an old pkg where we weren't before?
    const oldPkgPlugin = oldPkg ? Object.values(store.$plugin.getPlugins()).find((p) => p.name === oldPkg) : null;

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
    const newPkgPlugin = pkg ? Object.values(store.$plugin.getPlugins()).find((p) => p.name === pkg) : null;

    // Note - We can't block on oldPkg !== newPkg because on a fresh load the `from` route equals the `to` route
    if (pkg && (oldPkg !== pkg || from.fullPath === to.fullPath)) {
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
      setProduct(store, to);

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
        targetRoute: to
      })
    ]);

    validateResource(store, to);

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
    next();
  } catch (e) {
    if ( e.name === ClusterNotFoundError.NAME ) {
      return next('/home');
    } if ( e.name === RedirectToError.NAME ) {
      return next(e.url);
    } else {
      // Sets error 500 if lost connection to API
      store.commit('setError', { error: e, locationError: new Error(store.getters['i18n/t']('nav.failWhale.authMiddleware')) });

      return next('/fail-whale');
    }
  }
}
