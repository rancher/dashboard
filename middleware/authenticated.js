import { NAME as EXPLORER } from '@/config/product/explorer';
import { SETUP, TIMED_OUT } from '@/config/query-params';
import { SETTING } from '@/config/settings';
import { MANAGEMENT, NORMAN, VIRTUAL_PROVIDER } from '@/config/types';
import { _ALL_IF_AUTHED } from '@/plugins/steve/actions';
import { applyProducts } from '@/store/type-map';
import { findBy } from '@/utils/array';
import { ClusterNotFoundError } from '@/utils/error';
import { get } from '@/utils/object';
import { NAME as VIRTUAL } from '@/config/product/virtual';
import { AFTER_LOGIN_ROUTE } from '@/store/prefs';

let beforeEachSetup = false;

function setProduct(store, to) {
  let product = to.params?.product;

  if ( !product ) {
    const match = to.name?.match(/^c-cluster-([^-]+)/);

    if ( match ) {
      product = match[1];
    }
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

export default async function({
  route, app, store, redirect, req, isDev
}) {
  if ( route.path && typeof route.path === 'string') {
    // Ignore webpack hot module reload requests
    if ( route.path.startsWith('/__webpack_hmr/') ) {
      return;
    }

    // Ignore the error page
    if ( route.path.startsWith('/fail-whale') ) {
      return;
    }
  }
  // Initial ?setup=admin-password can technically be on any route
  const initialPass = route.query[SETUP];
  let firstLogin = null;

  try {
    // Load settings, which will either be just the public ones if not logged in, or all if you are
    await store.dispatch('management/findAll', {
      type: MANAGEMENT.SETTING,
      opt:  {
        load: _ALL_IF_AUTHED, url: `/v1/${ MANAGEMENT.SETTING }`, redirectUnauthorized: false
      }
    });

    const res = store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.FIRST_LOGIN);

    firstLogin = res?.value === 'true';
  } catch (e) {
  }

  if ( firstLogin === null ) {
    try {
      const res = await store.dispatch('rancher/find', {
        type: 'setting',
        id:   SETTING.FIRST_LOGIN,
        opt:  { url: `/v3/settings/${ SETTING.FIRST_LOGIN }` }
      });

      firstLogin = res?.value === 'true';
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

  // Make sure you're actually logged in
  function isLoggedIn(me) {
    store.commit('auth/hasAuth', true);
    store.commit('auth/loggedInAs', me.id);
  }

  function notLoggedIn() {
    store.commit('auth/hasAuth', true);

    if ( route.name === 'index' ) {
      return redirect(302, '/auth/login');
    } else {
      return redirect(302, `/auth/login?${ TIMED_OUT }`);
    }
  }

  function noAuth() {
    store.commit('auth/hasAuth', false);
  }

  if ( store.getters['auth/enabled'] !== false && !store.getters['auth/loggedIn'] ) {
    await store.dispatch('auth/getUser');
    const v3User = store.getters['auth/v3User'] || {};

    if (v3User?.mustChangePassword) {
      return redirect({ name: 'auth-setup' });
    }

    // In newer versions the API calls return the auth state instead of having to make a new call all the time.
    const fromHeader = store.getters['auth/fromHeader'];

    if ( fromHeader === 'none' ) {
      noAuth();
    } else if ( fromHeader === 'true' ) {
      const me = await findMe(store);

      isLoggedIn(me);
    } else if ( fromHeader === 'false' ) {
      notLoggedIn();
    } else {
      // Older versions look at principals and see what happens
      try {
        const me = await findMe(store);

        isLoggedIn(me);
      } catch (e) {
        const status = e?._status;

        if ( status === 404 ) {
          noAuth();
        } else {
          if ( status === 401 ) {
            notLoggedIn();
          } else {
            store.commit('setError', e);
          }

          return;
        }
      }
    }
  }

  // Load stuff
  await applyProducts(store);

  // Setup a beforeEach hook once to keep track of the current product
  if ( !beforeEachSetup ) {
    beforeEachSetup = true;

    store.app.router.beforeEach((to, from, next) => {
      setProduct(store, to);
      next();
    });

    // Call it for the initial pageload
    setProduct(store, route);

    if (process.client) {
      store.app.router.afterEach((to, from) => {
        // Clear state used to record if back button was used for navigation
        setTimeout(() => {
          window._popStateDetected = false;
        }, 1);
      });
    }
  }

  try {
    let clusterId = get(route, 'params.cluster');
    const productId = get(route, 'params.product');

    if (productId === VIRTUAL || route.name === `c-cluster-${ VIRTUAL }`) {
      const res = [
        store.dispatch('loadManagement'),
        store.dispatch('loadVirtual', clusterId),
      ];

      await Promise.all(res);
    } else if ( clusterId ) {
      // Run them in parallel
      const res = [
        store.dispatch('loadManagement'),
        store.dispatch('loadCluster', clusterId),
        store.dispatch('clearVirtual', clusterId),
      ];

      await Promise.all(res);
    } else {
      await store.dispatch('loadManagement');

      clusterId = store.getters['defaultClusterId']; // This needs the cluster list, so no parallel
      const isMultiCluster = store.getters['isMultiCluster']
      const isVirtualCluster = store.getters['isVirtualCluster']
      
      if ( clusterId && !isVirtualCluster) {
        await store.dispatch('loadCluster', clusterId);
      }

      if (isVirtualCluster && !isMultiCluster) {
        const value = {
          name: 'c-cluster-product',
          params: {
            cluster: clusterId,
            product: VIRTUAL,
          },
        }

        await store.dispatch('prefs/set', { 
          key: AFTER_LOGIN_ROUTE, 
          value,
        });
      }
    }
  } catch (e) {
    if ( e instanceof ClusterNotFoundError ) {
      return redirect(302, '/clusters');
    } else {
      store.commit('setError', e);

      return redirect(302, '/fail-whale');
    }
  }
}

async function findMe(store) {
  const principals = await store.dispatch('rancher/findAll', {
    type: NORMAN.PRINCIPAL,
    opt:  {
      url:                  '/v3/principals',
      redirectUnauthorized: false,
    }
  });

  const me = findBy(principals, 'me', true);

  return me;
}

async function tryInitialSetup(store, password = 'admin') {
  try {
    const res = await store.dispatch('auth/login', {
      provider: 'local',
      body:     {
        username: 'admin',
        password
      },
    });

    return res._status === 200;
  } catch (e) {
    console.error('Error trying initial setup', e); // eslint-disable-line no-console

    return false;
  }
}
