<script>
import ResourceTable from '@shell/components/ResourceTable';
import Link from '@shell/components/formatter/Link';
import Shortened from '@shell/components/formatter/Shortened';
import FleetIntro from '@shell/components/fleet/FleetIntro';

import {
  AGE,
  STATE,
  NAME,
  FLEET_SUMMARY,
  FLEET_REPO,
  FLEET_REPO_TARGET,
  FLEET_REPO_CLUSTERS_READY,
  FLEET_REPO_CLUSTER_SUMMARY,
  FLEET_REPO_PER_CLUSTER_STATE

} from '@shell/config/table-headers';
import { FLEET } from '@shell/config/labels-annotations';
import { STATES_ENUM } from '@shell/plugins/dashboard-store/resource-class';

// i18n-ignore repoDisplay
export default {

  name: 'FleetRepos',

  components: {
    ResourceTable, Link, Shortened, FleetIntro
  },
  props: {
    clusterId: {
      type:     String,
      required: false,
      default:  null,
    },
    rows: {
      type:     Array,
      required: true,
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
    }
  },

  computed: {
    filteredRows() {
      if (!this.rows) {
        return [];
      }

      // Returns boolean { [namespace]: true }
      const selectedWorkspace = this.$store.getters['namespaces']();

      return this.rows.filter((row) => {
        return !!selectedWorkspace[row.metadata.namespace];
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
      const fleetClusterSummary = {
        ...FLEET_REPO_CLUSTER_SUMMARY,
        formatterOpts: {
          // Fleet uses labels to identify clusters
          clusterLabel: this.clusterId
        },
      };

      // if hasPerClusterState then use the repo state
      const fleetPerClusterState = {
        ...FLEET_REPO_PER_CLUSTER_STATE,
        value: (row) => {
          const statePerCluster = row.clusterResourceStatus?.find((c) => {
            return c.clusterLabel === this.clusterId;
          });

          return statePerCluster ? statePerCluster?.status?.displayStatus : STATES_ENUM.ACTIVE;
        },
      };

      const summary = this.isClusterView ? [fleetClusterSummary] : [FLEET_REPO_CLUSTERS_READY, FLEET_SUMMARY];

      const state = this.isClusterView ? fleetPerClusterState : STATE;

      const out = [
        state,
        NAME,
        FLEET_REPO,
        FLEET_REPO_TARGET,
        ...summary,
        AGE
      ];

      return out;
    },
  },
  methods: {
    parseTargetMode(row) {
      return row.targetInfo?.mode === 'clusterGroup' ? this.t('fleet.gitRepo.warningTooltip.clusterGroup') : this.t('fleet.gitRepo.warningTooltip.cluster');
    },

    clusterViewResourceStatus(row) {
      return row.clusterResourceStatus.find((c) => {
        return c.metadata?.labels[FLEET.CLUSTER_NAME] === this.clusterId;
      });
    }
  },
};
</script>

<template>
  <div>
    <FleetIntro v-if="noRows && !loading" />
    <ResourceTable
      v-if="!noRows"
      v-bind="$attrs"
      :schema="schema"
      :headers="headers"
      :rows="rows"
      :loading="loading"
      :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
      key-field="_key"
      v-on="$listeners"
    >
      <template #cell:repo="{ row }">
        <Link
          :row="row"
          :value="row.spec.repo"
          label-key="repoDisplay"
          before-icon-key="repoIcon"
          url-key="spec.repo"
        />
        {{ row.cluster }}
        <template v-if="row.commitDisplay">
          <div class="text-muted">
            <Shortened
              long-value-key="status.commit"
              :row="row"
              :value="row.commitDisplay"
            />
          </div>
        </template>
      </template>

      <template
        v-if="!isClusterView"
        #cell:clustersReady="{ row }"
      >
        <span
          v-if="!row.clusterInfo"
          class="text-muted"
        >&mdash;</span>
        <span
          v-else-if="row.clusterInfo.unready"
          class="text-warning"
        >{{ row.clusterInfo.ready }}/{{
          row.clusterInfo.total }}</span>
        <span
          v-else
          class="cluster-count-info"
        >
          {{ row.clusterInfo.ready }}/{{ row.clusterInfo.total }}
          <i
            v-if="!row.clusterInfo.total"
            v-clean-tooltip.bottom="parseTargetMode(row)"
            class="icon icon-warning"
          />
        </span>
      </template>

      <template #cell:target="{ row }">
        {{ row.targetInfo.modeDisplay }}
      </template>
    </ResourceTable>
  </div>
</template>

<style lang="scss" scoped>
.cluster-count-info {
  display: flex;
  align-items: center;

  i {
    margin-left: 5px;
    font-size: 22px;
    color: var(--warning);
  }
}
</style>
