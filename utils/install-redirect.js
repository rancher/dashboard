import { REPO_TYPE, REPO, CHART, VERSION } from '@/config/query-params';

export default function(NAME, CHART_NAME) {
  return async function middleware({ redirect, store } ) {
    if ( !store.getters['type-map/isProductActive'](NAME) ) {
      await store.dispatch('catalog/load');

      const chart = store.getters['catalog/chart']({ chartName: CHART_NAME });

      if ( chart ) {
        return redirect({
          name:   'c-cluster-apps-install',
          query:  {
            [REPO_TYPE]: chart.repoType,
            [REPO]:      chart.repoName,
            [CHART]:     chart.chartName,
            [VERSION]:   chart.versions[0].version
          },
        });
      }
    }
  };
}
