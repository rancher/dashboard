import { REPO_TYPE, REPO, CHART, VERSION } from '@shell/config/query-params';

export default function(product, chartName, defaultResourceOrRoute) {
  return async function middleware({ redirect, store } ) {
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
    } else {
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
    }
  };
}
