import { TIMED_OUT } from '@shell/config/query-params';
import { NORMAN } from '@shell/config/types';
import { findBy } from '@shell/utils/array';

export async function loggedIn(store) {
  const me = await findMe(store);

  store.commit('auth/hasAuth', true);
  store.commit('auth/loggedInAs', me.id);
}

export async function notLoggedIn(store, redirect, route) {
  store.commit('auth/hasAuth', true);

  if ( route.name === 'index' ) {
    redirect(302, '/auth/login');
  } else {
    redirect(302, `/auth/login?${ TIMED_OUT }`);
  }
}

export function noAuth(store) {
  store.commit('auth/hasAuth', false);
}

export async function tryInitialSetup(store, password = 'admin') {
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

export async function handleFirstLogin(store, redirect, password) {
  const needsToBeSetup = await store.dispatch('auth/tryInitialSetup', password);

  if (needsToBeSetup) {
    if (password) {
      store.dispatch('setInitialPass', password);
    }

    return redirect({ name: 'auth-setup' });
  } else {
    return redirect({ name: 'auth-login' });
  }
}

export async function findMe(store) {
  // First thing we do in loadManagement is fetch principals anyway.... so don't ?me=true here
  const principals = await store.dispatch('rancher/findAll', {
    type: NORMAN.PRINCIPAL,
    opt:  {
      url:                  '/v3/principals',
      redirectUnauthorized: false,
    }
  }, { root: true });

  const me = findBy(principals, 'me', true);

  return me;
}

export async function handleUserMustChangePassword(store, redirect) {
  // `await` so we have one successfully request whilst possibly logged in (ensures fromHeader is populated from `x-api-cattle-auth`)
  await store.dispatch('auth/getUser');

  const v3User = store.getters['auth/v3User'] || {};

  if (v3User?.mustChangePassword) {
    redirect({ name: 'auth-setup' });
  }
}
