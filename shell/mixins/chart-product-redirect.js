import { REPO_TYPE, REPO, CHART, VERSION } from '@shell/config/query-params';

export default function(product, chartName, install = true) {
  return {
    data() {
      return { redirectPending: true };
    },

    async beforeCreate() {
      try {
        if (this.$store.getters['type-map/isProductActive'](product)) {
          return;
        }

        const cluster = this.$store.getters['currentCluster']?.id || 'local';

        if (install) {
          await this.$store.dispatch('catalog/load');
          const chart = this.$store.getters['catalog/chart']({ chartName });

          if ( chart ) {
            return this.$router.replace({
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
            this.$store.dispatch('loadingError', `Chart not found for ${ product }`);
          }
        } else {
          return this.$router.replace({
            name:   'c-cluster-explorer',
            params: { cluster },
          });
        }
      } finally {
        this.$nextTick(() => {
          this.$set(this, 'redirectPending', false);
        });
      }
    }
  };
}
