import { DEFAULT_WORKSPACE } from '@shell/config/types';
import { applyProducts } from '@shell/store/type-map';
import { ClusterNotFoundError } from '@shell/utils/error';
import { get } from '@shell/utils/object';
import dynamicPluginLoader from '@shell/pkg/dynamic-plugin-loader';
import { AFTER_LOGIN_ROUTE, WORKSPACE } from '@shell/store/prefs';
import { BACK_TO } from '@shell/config/local-storage';
import { NAME as FLEET_NAME } from '@shell/config/product/fleet.js';
import { setProduct, getClusterFromRoute, getPackageFromRoute, getProductFromRoute } from '@shell/utils/router';

export default {
  async fetch() {
    const route = this.$root.$options.context.route;
    const redirect = this.$root.$options.context.redirect;
    const $plugin = this.$root.$options.context.$plugin;
    const next = this.$root.$options.context.next;
    const from = this.$root.$options.context.from;

    await this.$store.dispatch('auth/attemptFirstLogin');
    await this.$store.dispatch('auth/authenticate');

    const backTo = window.localStorage.getItem(BACK_TO);

    if (backTo) {
      window.localStorage.removeItem(BACK_TO);

      window.location.href = backTo;
    }

    // GC should be notified of route change before any find/get request is made that might be used for that page
    this.$store.dispatch('gcRouteChanged', route);

    await applyProducts(this.$store, $plugin);
    const redirected = setProduct(this.$store, route, redirect);

    if (redirected) {
      return redirected();
    }

    // this.$store.app.router.afterEach((to, from) => {
    // // Clear state used to record if back button was used for navigation
    //   setTimeout(() => {
    //     window._popStateDetected = false;
    //   }, 1);
    // });

    try {
      let clusterId = get(route, 'params.cluster');

      // Route can provide cluster ID via metadata
      if (!clusterId && route) {
        clusterId = getClusterFromRoute(route);
      }

      const pkg = getPackageFromRoute(route);
      const product = getProductFromRoute(route);

      const oldPkg = getPackageFromRoute(from || route);
      const oldProduct = getProductFromRoute(from || route);
      const newPkgPlugin = pkg ? Object.values($plugin.getPlugins()).find((p) => p.name === pkg) : null;
      const oldPkgPlugin = oldPkg ? Object.values($plugin.getPlugins()).find((p) => p.name === oldPkg) : null;

      if (oldPkg && oldPkg !== pkg ) {
      // Execute anything optional the plugin wants to. For example resetting it's store to remove data
        await oldPkgPlugin.onLeave(this.$store, {
          clusterId,
          product,
          oldProduct,
          oldIsExt: !!oldPkg
        });
      }

      await Promise.all([
        this.$store.dispatch('loadManagement'),
        this.$store.dispatch('loadCluster', {
          id:          clusterId,
          oldPkg:      oldPkgPlugin,
          newPkg:      newPkgPlugin,
          product,
          oldProduct,
          targetRoute: route
        })
      ]);

      // Note - We can't block on oldPkg !== newPkg because on a fresh load the `from` route equals the `to` route
      if (pkg && (oldPkg !== pkg || from.fullPath === route.fullPath)) {
        // Execute anything optional the plugin wants to
        await newPkgPlugin.onEnter(this.$store, {
          clusterId,
          product,
          oldProduct,
          oldIsExt: !!oldPkg
        });
      }

      if (!route.matched?.length) {
        // If a plugin claims the route and is loaded correctly we'll get a route back
        const newLocation = await dynamicPluginLoader.check({ route, store: this.$store });

        // If we have a new location, double check that it's actually valid
        const resolvedRoute = newLocation ? this.$store.app.router.resolve(newLocation) : null;

        if (resolvedRoute?.route.matched.length) {
        // Note - don't use `redirect` or `this.$store.app.route` (breaks feature by failing to run middleware in default layout)
          return next(newLocation);
        }
      }

      // Ensure that the activeNamespaceCache is updated given the change of context either from or to a place where it uses workspaces
      // When fleet moves to it's own package this should be moved to pkg onEnter/onLeave
      if ((oldProduct === FLEET_NAME || product === FLEET_NAME) && oldProduct !== product) {
        this.$store.commit('updateWorkspace', {
          value:   this.$store.getters['prefs/get'](WORKSPACE) || DEFAULT_WORKSPACE,
          getters: this.$store.getters
        });
      }

      if (!clusterId) {
        clusterId = this.$store.getters['defaultClusterId']; // This needs the cluster list, so no parallel
        const isSingleProduct = this.$store.getters['isSingleProduct'];

        if (isSingleProduct?.afterLoginRoute) {
          const value = {
            name:   'c-cluster-product',
            ...isSingleProduct.afterLoginRoute,
            params: {
              cluster: clusterId,
              ...isSingleProduct.afterLoginRoute?.params
            },
          };

          await this.$store.dispatch('prefs/set', {
            key: AFTER_LOGIN_ROUTE,
            value,
          });
        }
      }
    } catch (e) {
      if ( e.name === ClusterNotFoundError.name ) {
        return redirect(302, '/home');
      } else {
      // Sets error 500 if lost connection to API
        this.$store.commit('setError', { error: e, locationError: new Error(this.$store.getters['i18n/t']('nav.failWhale.authMiddleware')) });

        return redirect(302, '/fail-whale');
      }
    }
  },

  watch: {
    '$route'() {
      this.$fetch();
    }
  }
};
