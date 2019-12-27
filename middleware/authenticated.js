import { RANCHER } from '@/config/types';
import { findBy } from '@/utils/array';
import { SETUP } from '@/config/query-params';

export default async function({
  route, app, store, redirect, req, isDev
}) {
  if ( store.getters['auth/principal'] ||
       route.name === 'auth-setup' ||
       (route.path && typeof route.path === 'string' && route.path.startsWith('/__webpack_hmr/'))
  ) {
    return;
  }

  const initialPass = route.query[SETUP];

  if ( initialPass ) {
    const ok = await tryInitialSetup(store, initialPass, isDev);

    if ( ok ) {
      redirect(302, `/auth/setup?${ SETUP }=${ escape(initialPass) }`);
    } else {
      redirect(302, '/auth/login');
    }
  }

  if ( store.getters['auth/loggedIn'] ) {
    return;
  }

  try {
    const principals = await store.dispatch('rancher/findAll', {
      type: RANCHER.PRINCIPAL,
      opt:  { url: '/v3/principals' }
    });

    const me = findBy(principals, 'me', true);

    store.commit('auth/loggedInAs', me.id);

    if ( !process.server ) {
      // @TODO pick a cluster for multi-cluster or do something different for global scope
      store.dispatch('cluster/subscribe');
    }

    await store.dispatch('preload');
  } catch (e) {
    if ( e && (!e.status || e.status !== '401') ) {
      console.log(JSON.stringify(e));
    }

    redirect(302, '/auth/login');
  }
}

async function tryInitialSetup(store, password, isDev) {
  try {
    const firstLogin = await store.dispatch('rancher/find', {
      type: RANCHER.SETTING,
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
