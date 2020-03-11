import { NORMAN } from '@/config/types';
import { findBy } from '@/utils/array';
import { SETUP } from '@/config/query-params';
import { get } from '@/utils/object';
import { ClusterNotFoundError } from '@/utils/error';

export default async function({
  route, app, store, redirect, req, isDev
}) {
  // Ignore webpack hot module reload requests
  if ( route.path && typeof route.path === 'string' && route.path.startsWith('/__webpack_hmr/') ) {
    return;
  }

  // Initial ?setup=admin-password can technically be on any route
  const initialPass = route.query[SETUP];

  if ( initialPass ) {
    const ok = await tryInitialSetup(store, initialPass, isDev);

    if ( ok ) {
      redirect(302, `/auth/setup?${ SETUP }=${ escape(initialPass) }`);
    } else {
      redirect(302, '/auth/login');
    }
  }

  // Make sure you're actually logged in
  if ( store.getters['auth/enabled'] !== false && !store.getters['auth/loggedIn'] ) {
    try {
      const principals = await store.dispatch('rancher/findAll', {
        type: NORMAN.PRINCIPAL,
        opt:  { url: '/v3/principals' }
      });

      const me = findBy(principals, 'me', true);

      store.commit('auth/loggedInAs', me.id);
    } catch (e) {
      const status = e?._status;

      if ( status === 404 ) {
        store.commit('auth/hasAuth', false);
      } else {
        store.commit('auth/hasAuth', true);

        if ( status === 401 ) {
          redirect(302, '/auth/login');
        } else {
          console.log(JSON.stringify(e));
        }
      }
    }
  }

  // Load stuff
  const clusterId = get(route, 'params.cluster');

  try {
    await Promise.all([
      await store.dispatch('loadManagement'),
      await store.dispatch('loadCluster', clusterId),
    ]);
  } catch (e) {
    if ( e instanceof ClusterNotFoundError ) {
      redirect(302, '/clusters');
    } else {
      throw e;
    }
  }
}

async function tryInitialSetup(store, password, isDev) {
  try {
    const firstLogin = await store.dispatch('rancher/find', {
      type: NORMAN.SETTING,
      id:   'first-login',
      opt:  { url: '/v3/settings/first-login' }
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
    console.log(e);

    return false;
  }
}
