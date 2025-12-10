import dynamicPluginLoader from '@shell/pkg/dynamic-plugin-loader';
import { routeRequiresAuthentication } from '@shell/utils/router';
import { EXT_ROUTE_PROP } from '@shell/core/plugin.ts';

export function install(router, context) {
  router.beforeEach((to, from, next) => runtimeExtensionRoute(to, from, next, context));
}

export async function runtimeExtensionRoute(to, from, next, { store }) {
  console.error('TO ROUTE', to);
  if (to.meta?.[EXT_ROUTE_PROP] && to.meta?.product) {
    console.error('WE ARE ON EXTENSiON ROUTE COUNTRY!');

    const allTypes = store.getters['type-map/allTypes'](to.meta?.product)?.all;

    if (allTypes) {
      console.error('ALL TYPES FOR PRODUCT', allTypes);

      const matchFound = Object.entries(allTypes).find(([key, value]) => {
        return value.route?.name === to.name && value.route?.meta?.pkg === to.meta?.pkg;
      });

      console.error('MATCH FOUND', matchFound);

      if (!matchFound) {
        return next({ name: '404' });
      }
    }
  }

  if (!routeRequiresAuthentication(to) || to.name !== '404') {
    return next();
  }

  try {
    // Handle the loading of dynamic plugins (Harvester) because we only want to attempt to load those plugins and routes if we first couldn't find a page.
    // We should probably get rid of this concept entirely and just load plugins at the start.
    await store.dispatch('loadManagement');
    const newLocation = await dynamicPluginLoader.check({ route: { path: window.location.pathname }, store });

    // If we have a new location, double check that it's actually valid
    const resolvedRoute = newLocation?.path ? store.app.router.resolve({ path: newLocation.path.replace(/^\/{0,1}dashboard/, '') }) : null;

    if (resolvedRoute?.route.matched.length) {
      // Note - don't use `redirect` or `store.app.route` (breaks feature by failing to run middleware in default layout)
      return next(resolvedRoute.resolved.path);
    }
  } catch (e) {
    console.error('Failed to load harvester', e); // eslint-disable-line no-console
  }

  next();
}
