<script>
import ResourceTable from '@shell/components/ResourceTable';
import FleetIntro from '@shell/components/fleet/FleetIntro';

import {
  AGE,
  FLEET_REPO,
  FLEET_REPO_CLUSTER_SUMMARY,
  FLEET_APPLICATION_CLUSTERS_READY,
  FLEET_REPO_PER_CLUSTER_STATE,
  FLEET_REPO_TARGET,
  FLEET_SUMMARY,
  NAME,
  STATE,
} from '@shell/config/table-headers';

export default {

  name: 'FleetRepos',

  components: {
    FleetIntro,
    ResourceTable,
  },
  props: {
    rows: {
      type:     Array,
      required: true,
    },

    workspace: {
      type:    String,
      default: ''
    },

    clusterId: {
      type:     String,
      required: false,
      default:  null,
    },

    schema: {
      type:     Object,
      required: true,
    },

    loading: {
      type:     Boolean,
      required: false,
    },

    useQueryParamsForSimpleFiltering: {
      type:    Boolean,
      default: false
    },

    showIntro: {
      type:    Boolean,
      default: true,
    }
  },

  computed: {
    filteredRows() {
      if (!this.rows) {
        return [];
      }

      const selectedNamespaces = this.$store.getters['namespaces']();

      return this.rows.filter((row) => {
        if (this.workspace) {
          return this.workspace === row.metadata.namespace;
        }

        return !!selectedNamespaces[row.metadata.namespace];
      });
    },

    isClusterView() {
      return !!this.clusterId;
    },

    noRows() {
      return !this.filteredRows.length;
    },

    headers() {
      // Cluster summary is only shown in the cluster view
      const summary = this.isClusterView ? [{
        ...FLEET_REPO_CLUSTER_SUMMARY,
        formatterOpts: { clusterId: this.clusterId },
      }] : [FLEET_APPLICATION_CLUSTERS_READY, FLEET_SUMMARY];

      // if hasPerClusterState then use the repo state
      const state = this.isClusterView ? {
        ...FLEET_REPO_PER_CLUSTER_STATE,
        value: (repo) => repo.clusterState(this.clusterId),
      } : STATE;

      return [
        state,
        NAME,
        FLEET_REPO,
        FLEET_REPO_TARGET,
        ...summary,
        AGE
      ];
    },

    shouldShowIntro() {
      return this.showIntro && !this.filteredRows.length;
    },
  },
};
</script>

<template>
  <div>
    <FleetIntro
      v-if="shouldShowIntro && !loading"
      :schema="schema"
      :labelKey="'gitRepo'"
      :icon="'icon-git'"
    />
    <ResourceTable
      v-if="!shouldShowIntro"
      v-bind="$attrs"
      :schema="schema"
      :headers="headers"
      :rows="rows"
      :loading="loading"
      :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
      :namespaced="!workspace"
      key-field="_key"
    />
  </div>
</template>

<style lang="scss" scoped>
</style>
