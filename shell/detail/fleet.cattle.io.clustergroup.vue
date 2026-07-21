<script>
import Loading from '@shell/components/Loading';
import ResourcesSummary from '@shell/components/fleet/ResourcesSummary';
import FleetClusters from '@shell/components/fleet/FleetClusters';
import ResourceTabs from '@shell/components/form/ResourceTabs';
import Tab from '@shell/components/Tabbed/Tab';
import { FLEET } from '@shell/config/types';
import { allHash } from '@shell/utils/promise';

export default {
  name: 'DetailClusterGroup',

  emits: ['input'],

  components: {
    Loading,
    ResourceTabs,
    ResourcesSummary,
    FleetClusters,
    Tab,
  },

  props: {
    value: {
      type:     Object,
      required: true,
    },
  },

  async fetch() {
    const selector = this.value.spec?.selector || {};
    const hasSelector = Object.keys(selector.matchLabels || {}).length > 0 || (selector.matchExpressions || []).length > 0;

    await allHash({
      // Needed by the group's targetClusters getter (it reads workspace.clusters).
      workspaces: this.$store.dispatch('cluster/findAll', { type: FLEET.WORKSPACE }),

      // Fetch only the clusters this group selects (server-side, by its own spec.selector) rather
      // than every cluster. An empty selector matches all clusters in the workspace, so in that
      // case scope to the workspace namespace instead (findLabelSelector rejects empty selectors).
      fleetClusters: hasSelector ? this.$store.dispatch('management/findLabelSelector', {
        type:     FLEET.CLUSTER,
        matching: { namespace: this.value.metadata.namespace, labelSelector: selector },
      }) : this.$store.dispatch('management/findAll', { type: FLEET.CLUSTER, opt: { namespaced: this.value.metadata.namespace } }),
    });
  },

  computed: {
    clusterSchema() {
      return this.$store.getters['management/schemaFor'](FLEET.CLUSTER);
    }
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <h2 class="mt-20">
      Resource Summary
    </h2>
    <ResourcesSummary :value="value.status.resourceCounts" />

    <ResourceTabs
      :value="value"
      mode="view"
      class="mt-20"
      @input="$emit('input', $event)"
    >
      <Tab
        label="Clusters"
        name="clusters"
      >
        <FleetClusters
          :schema="clusterSchema"
          :rows="value.targetClusters"
          :paging="true"
          :table-actions="false"
          :search="false"
          paging-label="sortableTable.paging.resource"
        />
      </Tab>
    </ResourceTabs>
  </div>
</template>
