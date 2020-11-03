import { NORMAN, MANAGEMENT } from '@/config/types';
import { findBy } from '@/utils/array';
import { SETUP } from '@/config/query-params';
import { get } from '@/utils/object';
import { ClusterNotFoundError } from '@/utils/error';
import { applyProducts } from '@/store/type-map';
import { NAME as EXPLORER } from '@/config/product/explorer';

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

  store.commit('setProduct', product);
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

  if ( initialPass ) {
    const ok = await tryInitialSetup(store, initialPass, isDev);

    if ( ok ) {
      return redirect(302, `/auth/setup?${ SETUP }=${ escape(initialPass) }`);
    } else {
      return redirect(302, '/auth/login');
    }
  }

  // Make sure you're actually logged in
  if ( store.getters['auth/enabled'] !== false && !store.getters['auth/loggedIn'] ) {
    try {
      const principals = await store.dispatch('rancher/findAll', {
        type: NORMAN.PRINCIPAL,
        opt:  {
          url:                  '/v3/principals',
          redirectUnauthorized: false,
        }
      });

      const me = findBy(principals, 'me', true);

      store.commit('auth/hasAuth', true);
      store.commit('auth/loggedInAs', me.id);
    } catch (e) {
      const status = e?._status;

      if ( status === 404 ) {
        store.commit('auth/hasAuth', false);
      } else {
        store.commit('auth/hasAuth', true);

        if ( status === 401 ) {
          if ( process.env.dev ) {
            return redirect(302, '/auth/login');
          } else if ( process.client ) {
            window.location.href = '/login';
          } else {
            return redirect(302, '/login');
          }
        } else {
          store.commit('setError', e);
          console.log(JSON.stringify(e)); // eslint-disable-line no-console
        }
      }

      return;
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
  }

  try {
    let clusterId = get(route, 'params.cluster');

    if ( clusterId ) {
      // Run them in parallel
      await Promise.all([
        await store.dispatch('loadManagement'),
        await store.dispatch('loadCluster', clusterId),
      ]);
    } else {
      await store.dispatch('loadManagement');

      clusterId = store.getters['defaultClusterId']; // This needs the cluster list, so no parallel

      if ( clusterId ) {
        await store.dispatch('loadCluster', clusterId);
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

async function tryInitialSetup(store, password, isDev) {
  try {
    const firstLogin = await store.dispatch('management/find', {
      type: MANAGEMENT.SETTING,
      id:   'first-login',
      opt:  { url: `${ MANAGEMENT.SETTING }s/first-login` }
    });

    if ( isDev ) {
      // Ignore first-login for dev
    } else if ( !firstLogin || firstLogin.value !== 'true' ) {
      // Require first-login to be set for prod
      return false;
    }

    const res = await store.dispatch('auth/login', {
      provider: 'local',
      body:     {
        username: 'admin',
        password
      },
    });

    return res === true;
  } catch (e) {
    console.error('Error trying initial setup', e); // eslint-disable-line no-console

    return false;
  }
}
