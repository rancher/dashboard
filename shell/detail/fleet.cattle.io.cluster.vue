<script>
import Loading from '@shell/components/Loading';
import ResourcesSummary from '@shell/components/fleet/ResourcesSummary';
import FleetRepos from '@shell/components/fleet/FleetRepos';
import ResourceTabs from '@shell/components/form/ResourceTabs';
import Tab from '@shell/components/Tabbed/Tab';
import { MANAGEMENT, FLEET } from '@shell/config/types';
import { FLEET as FLEET_LABELS } from '@shell/config/labels-annotations';

export default {
  name: 'DetailCluster',

  components: {
    Loading,
    ResourcesSummary,
    FleetRepos,
    ResourceTabs,
    Tab,
  },

  props: {
    value: {
      type:     Object,
      required: true,
    },
  },

  async fetch() {
    const clusterId = this.value?.metadata?.labels[FLEET_LABELS.CLUSTER_NAME];

    this.rancherCluster = await this.$store.dispatch('management/find', {
      type: MANAGEMENT.CLUSTER,
      id:   clusterId
    });

    this.allRepos = await this.$store.dispatch('management/findAll', { type: FLEET.GIT_REPO });

    await this.$store.dispatch('management/findAll', { type: FLEET.WORKSPACE });
  },

  data() {
    return { rancherCluster: null, allRepos: [] };
  },

  computed: {
    repos() {
      return this.allRepos.filter((x) => {
        return x.targetClusters.includes(this.value);
      });
    },

    repoSchema() {
      return this.$store.getters['management/schemaFor'](FLEET.GIT_REPO);
    },
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <h2 v-t="'fleet.cluster.summary'" class="mt-20" />
    <ResourcesSummary :value="value.status.resourceCounts" />

    <ResourceTabs v-model="value" mode="view" class="mt-20">
      <Tab label="Git Repos" name="repos" :weight="19">
        <FleetRepos
          :rows="repos"
          :schema="repoSchema"
          :paging="true"
          paging-label="sortableTable.paging.resource"
        />
      </Tab>
    </ResourceTabs>
  </div>
</template>
