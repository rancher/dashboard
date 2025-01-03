export function install(router, context) {
  router.beforeEach(async(to, from, next) => await loadI18n(to, from, next, context));
}

export async function loadI18n(to, from, next, { store }) {
  try {
    await store.dispatch('i18n/init');
  } catch (e) {
    console.error('Failed to initialize i18n', e); // eslint-disable-line no-console
  }

  next();
}
