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
    const hash = {
      workspaces:    this.$store.dispatch('cluster/findAll', { type: FLEET.WORKSPACE }),
      FleetClusters: this.$store.dispatch('management/findAll', { type: FLEET.CLUSTER }),
    };

    await allHash(hash);
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
