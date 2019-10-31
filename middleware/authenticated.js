import { RANCHER } from '~/config/types';
import { findBy } from '@/utils/array';
import { SETUP } from '@/config/query-params';

export default async function({
  route, app, store, redirect
}) {
  if ( store.getters['auth/principal'] || route.name === 'auth-setup' ) {
    return;
  }

  const initialPass = route.query[SETUP];

  if ( initialPass ) {
    const ok = await tryInitialSetup(store, initialPass);

    if ( ok ) {
      redirect(302, `/auth/setup?${ SETUP }=${ escape(initialPass) }`);
    } else {
      redirect(302, '/auth/login');
    }
  }

  try {
    const principals = await store.dispatch('rancher/findAll', {
      type: RANCHER.PRINCIPAL,
      opt:  { url: '/v3/principals' }
    });

    const me = findBy(principals, 'me', true);

    store.commit('auth/loggedInAs', me.id);

    await store.dispatch('preload');
  } catch (e) {
    redirect(302, '/auth/login');
  }
}

async function tryInitialSetup(store, password) {
  try {
    const firstLogin = await store.dispatch('rancher/find', {
      type: RANCHER.SETTING,
      id:   'first-login',
      opt:  { url: '/v3/settings/first-login' }
    });

    if ( !firstLogin || firstLogin.value !== 'true' ) {
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
