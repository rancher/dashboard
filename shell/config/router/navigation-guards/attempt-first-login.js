import { SETUP } from '@shell/config/query-params';
import { SETTING } from '@shell/config/settings';
import { MANAGEMENT, NORMAN } from '@shell/config/types';
import { tryInitialSetup } from '@shell/utils/auth';
import { routeRequiresAuthentication } from '@shell/utils/router';

export function install(router, context) {
  router.beforeEach(async(to, from, next) => await attemptFirstLogin(to, from, next, context));
}

export async function attemptFirstLogin(to, from, next, { store }) {
  if (!routeRequiresAuthentication(to)) {
    return next();
  }

  // Initial ?setup=admin-password can technically be on any route
  let initialPass = to.query[SETUP];
  let firstLogin = null;

  try {
    const res = store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.FIRST_LOGIN);
    const plSetting = store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.PL);

    firstLogin = res?.value === 'true';

    if (!initialPass && plSetting?.value === 'Harvester') {
      initialPass = 'admin';
    }
  } catch (e) {
    console.error('Failed looking up first login setting', e); // eslint-disable-line no-console
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
      console.error('Failed looking up first login setting', e); // eslint-disable-line no-console
    }
  }

  // TODO show error if firstLogin and default pass doesn't work
  if ( firstLogin ) {
    const ok = await tryInitialSetup(store, initialPass);

    if (ok) {
      if (initialPass) {
        store.dispatch('auth/setInitialPass', initialPass);
      }

      return next({ name: 'auth-setup' });
    } else {
      return next({ name: 'auth-login' });
    }
  }

  next();
}
