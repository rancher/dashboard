<script>
import { mapGetters } from 'vuex';
import isEqual from 'lodash/isEqual';
import {
  CHART, REPO, REPO_TYPE, VERSION, CATEGORY, TAG, DEPRECATED
} from '@shell/config/query-params';
import ChartMixin from '@shell/mixins/chart';
import Loading from '@shell/components/Loading';
import ChartDetail from '@shell/components/charts/ChartDetails.vue';

export default {
  components: {
    ChartDetail,
    Loading
  },

  mixins: [
    ChartMixin
  ],

  async fetch() {
    await this.fetchChart();
  },

  computed: { ...mapGetters(['currentCluster']) },

  watch: {
    '$route.query'(neu, old) {
      // If the query changes, refetch the chart
      // When going back to app list, the query is empty and we don't want to refetch
      if ( !isEqual(neu, old) && Object.keys(neu).length > 0 ) {
        this.$fetch();
      }
    },
  },

  methods: {
    clickInstall() {
      this.$router.push({
        name:   'c-cluster-apps-charts-install',
        params: {
          cluster: this.$route.params.cluster,
          product: this.$store.getters['productId'],
        },
        query: {
          [REPO_TYPE]:  this.query.repoType,
          [REPO]:       this.query.repoName,
          [CHART]:      this.query.chartName,
          [VERSION]:    this.query.versionName,
          [DEPRECATED]: this.query.deprecated,
        }
      });
    },

    clickFooter({ type, value }) {
      const params = {
        cluster: this.$route.params.cluster,
        product: this.$store.getters['productId'],
      };

      let queryValue;

      if (type === REPO) {
        const repos = this.$store.getters['catalog/repos'];

        queryValue = repos.find((r) => r.nameDisplay === value)?.metadata?.uid;
      } else if (type === CATEGORY || type === TAG) {
        queryValue = value.toLowerCase();
      }

      if (queryValue) {
        this.$router.push({
          name:  'c-cluster-apps-charts',
          params,
          query: { [type]: queryValue },
        });
      }
    },
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <ChartDetail
    v-else
    :current-cluster="currentCluster"
    :repo-type="query.repoType"
    :repo-name="query.repoName"
    :chart-name="query.chartName"
    :version-name="query.versionName"
    :repo="repo"
    :chart="chart"
    :requires="requires"
    :warnings="warnings"
    :mapped-versions="mappedVersions"
    :version="version"
    :current-version="currentVersion"
    :target-version="targetVersion"
    :version-info="versionInfo"
    :version-info-error="versionInfoError"
    :existing="existing"
    :show-pre-release="showPreRelease"
    :has-readme="hasReadme"
    :action="action"
    @click:install="clickInstall"
    @click:footer="clickFooter"
  />
</template>
