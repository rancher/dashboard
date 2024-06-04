import { SETUP } from '@shell/config/query-params';
import { SETTING } from '@shell/config/settings';
import { MANAGEMENT, NORMAN, DEFAULT_WORKSPACE } from '@shell/config/types';
import { applyProducts } from '@shell/store/type-map';
import { ClusterNotFoundError, RedirectToError } from '@shell/utils/error';
import { get } from '@shell/utils/object';
import dynamicPluginLoader from '@shell/pkg/dynamic-plugin-loader';
import { AFTER_LOGIN_ROUTE, WORKSPACE } from '@shell/store/prefs';
import { BACK_TO } from '@shell/config/local-storage';
import { NAME as FLEET_NAME } from '@shell/config/product/fleet.js';
import {
  validateResource, setProduct, isLoggedIn, notLoggedIn, noAuth, tryInitialSetup, findMe
} from '@shell/utils/auth';
import { getClusterFromRoute, getProductFromRoute, getPackageFromRoute } from '@shell/utils/router';
import { fetchInitialSettings } from '@shell/utils/settings';

let beforeEachSetup = false;

export default async function({
  route, store, redirect, from, $plugin, next
}) {
  // Initial ?setup=admin-password can technically be on any route
  let initialPass = route.query[SETUP];
  let firstLogin = null;

  try {
    // Load settings, which will either be just the public ones if not logged in, or all if you are
    await fetchInitialSettings(store);

    const res = store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.FIRST_LOGIN);
    const plSetting = store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.PL);

    firstLogin = res?.value === 'true';

    if (!initialPass && plSetting?.value === 'Harvester') {
      initialPass = 'admin';
    }
  } catch (e) {
  }

  if ( firstLogin === null ) {
    try {
      const res = await store.dispatch('rancher/find', {
        type: NORMAN.SETTING,
        id:   SETTING.FIRST_LOGIN,
        opt:  { url: `/v3/settings/${ SETTING.FIRST_LOGIN }` }
      });

      firstLogin = res?.value === 'true';

      const plSetting = await store.dispatch('rancher/find', {
        type: NORMAN.SETTING,
        id:   SETTING.PL,
        opt:  { url: `/v3/settings/${ SETTING.PL }` }
      });

      if (!initialPass && plSetting?.value === 'Harvester') {
        initialPass = 'admin';
      }
    } catch (e) {
    }
  }

  // TODO show error if firstLogin and default pass doesn't work
  if ( firstLogin ) {
    const ok = await tryInitialSetup(store, initialPass);

    if (ok) {
      if (initialPass) {
        store.dispatch('auth/setInitialPass', initialPass);
      }

      return redirect({ name: 'auth-setup' });
    } else {
      return redirect({ name: 'auth-login' });
    }
  }

  if ( store.getters['auth/enabled'] !== false && !store.getters['auth/loggedIn'] ) {
    // `await` so we have one successfully request whilst possibly logged in (ensures fromHeader is populated from `x-api-cattle-auth`)
    await store.dispatch('auth/getUser');

    const v3User = store.getters['auth/v3User'] || {};

    if (v3User?.mustChangePassword) {
      return redirect({ name: 'auth-setup' });
    }

    // In newer versions the API calls return the auth state instead of having to make a new call all the time.
    const fromHeader = store.getters['auth/fromHeader'];

    if ( fromHeader === 'none' ) {
      noAuth(store);
    } else if ( fromHeader === 'true' ) {
      const me = await findMe(store);

      isLoggedIn(store, me);
    } else if ( fromHeader === 'false' ) {
      notLoggedIn(store, redirect, route);

      return;
    } else {
      // Older versions look at principals and see what happens
      try {
        const me = await findMe(store);

        isLoggedIn(store, me);
      } catch (e) {
        const status = e?._status;

        if ( status === 404 ) {
          noAuth(store);
        } else {
          if ( status === 401 ) {
            notLoggedIn(store, redirect, route);
          } else {
            store.commit('setError', { error: e, locationError: new Error('Auth Middleware') });
          }

          return;
        }
      }
    }

    store.dispatch('gcStartIntervals');
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

    if (!route.matched?.length) {
      // If there are no matching routes we could be trying to nav to a page belonging to a dynamic plugin which needs loading
      await Promise.all([
        ...always,
      ]);

      // If a plugin claims the route and is loaded correctly we'll get a route back
      const newLocation = await dynamicPluginLoader.check({ route, store });

      // If we have a new location, double check that it's actually valid
      const resolvedRoute = newLocation ? store.app.router.resolve(newLocation) : null;

      if (resolvedRoute?.route.matched.length) {
        // Note - don't use `redirect` or `store.app.route` (breaks feature by failing to run middleware in default layout)
        return next(newLocation);
      }
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
