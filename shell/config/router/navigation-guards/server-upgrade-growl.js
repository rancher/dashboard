import { UPGRADED, _FLAGGED, _UNFLAG } from '@shell/config/query-params';

export function install(router, context) {
  router.afterEach((to, from) => renderServerUpgradeGrowl(to, from, { router, ...context }));
}

export async function renderServerUpgradeGrowl(to, from, { router, store }) {
  const upgraded = to.query[UPGRADED] === _FLAGGED;

  if ( upgraded ) {
    router.applyQuery({ [UPGRADED]: _UNFLAG });

    store.dispatch('growl/success', {
      title:   store.getters['i18n/t']('serverUpgrade.title'),
      message: store.getters['i18n/t']('serverUpgrade.message'),
      timeout: 0,
    });
  }
}
