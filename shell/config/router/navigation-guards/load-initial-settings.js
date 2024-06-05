import { fetchInitialSettings } from '@shell/utils/settings';

export function install(router, context) {
  router.beforeEach((from, to, next) => loadInitialSettings(from, to, next));
}

export async function loadInitialSettings(from, to, next) {
  try {
    await fetchInitialSettings();
  } catch (ex) {}

  next();
}
