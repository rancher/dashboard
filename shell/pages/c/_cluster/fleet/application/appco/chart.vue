<script>
import isEqual from 'lodash/isEqual';
import {
  CHART, REPO, REPO_TYPE, VERSION, DEPRECATED
} from '@shell/config/query-params';
import { FLEET, MANAGEMENT } from '@shell/config/types';
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

  computed: {
    currentCluster() {
      return this.$store.getters['management/all'](MANAGEMENT.CLUSTER).find((x) => x.isLocal);
    },
  },

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
        name:   'c-cluster-fleet-application-resource-create',
        params: {
          cluster:  this.$route.params.cluster,
          product:  this.$store.getters['productId'],
          resource: FLEET.HELM_OP,
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
  />
</template>

<style lang="scss" scoped>
</style>
