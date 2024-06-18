import { REPO_TYPE, REPO, CHART, VERSION } from '@shell/config/query-params';
import { routeRequiresInstallRedirect, findMeta } from '@shell/utils/router';

/**
 * All of this is related to the original install-redirect middleware we used previously. Since removing
 * middleware this is the closest analog since middleware used to run in beforeeach.
 *
 * I originally tried using mixins but the pages wouldn't render if the product didn't exist due to the way our templates/default.vue
 * determines if a cluster is ready before rendering the child route.
 *
 * I personally think that we should remove this concept entirely but I'm leaving it in for completeness sake while getting through the vue3 migration.
 */

export const INSTALL_REDIRECT_META_KEY = 'installRedirect';

export function install(router, context) {
  router.beforeEach(async(to, from, next) => await handleInstallRedirect(to, from, next, context));
}

async function handleInstallRedirect(to, from, next, { store }) {
  if (!routeRequiresInstallRedirect(to)) {
    return next();
  }

  try {
    const installRedirectArguments = findMeta(to, INSTALL_REDIRECT_META_KEY);

    await installRedirect(store, next, installRedirectArguments);
  } catch (e) {
    console.error('Failed to use install-redirect', e); // eslint-disable-line no-console
  }

  next();
}

// Arguments here should be the same as the arguments from installRedirectImpl below
export function installRedirectRouteMeta(product, chartName, defaultResourceOrRoute, install = true) {
  return { [INSTALL_REDIRECT_META_KEY]: [...arguments] };
}

async function installRedirect(store, redirect, args) {
  await installRedirectImpl(...args);

  async function installRedirectImpl(product, chartName, defaultResourceOrRoute, install = true) {
    const cluster = store.getters['currentCluster']?.id || 'local';

    if ( store.getters['type-map/isProductActive'](product) ) {
    // If the product is installed and there's a default resource, redirect there

      if ( defaultResourceOrRoute ) {
        if ( typeof defaultResourceOrRoute === 'object' ) {
          return redirect(defaultResourceOrRoute);
        }

        return redirect({
          name:   'c-cluster-product-resource',
          params: {
            cluster,
            product,
            resource: defaultResourceOrRoute
          },
        });
      }

    // Otherwise just let the middleware pass through
    } else if (install) {
    // The product is not installed, redirect to the details chart

      await store.dispatch('catalog/load');

      const chart = store.getters['catalog/chart']({ chartName });

      if ( chart ) {
        return redirect({
          name:   'c-cluster-apps-charts-chart',
          params: { cluster },
          query:  {
            [REPO_TYPE]: chart.repoType,
            [REPO]:      chart.repoName,
            [CHART]:     chart.chartName,
            [VERSION]:   chart.versions[0].version
          },
        });
      } else {
      // The chart's not available
        store.dispatch('loadingError', `Chart not found for ${ product }`);
      }
    } else {
      return redirect({
        name:   'c-cluster-explorer',
        params: { cluster },
      });
    }
  }
}
