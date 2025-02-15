<script>
import Loading from '@shell/components/Loading';
import ResourcesSummary from '@shell/components/fleet/ResourcesSummary';
import FleetRepos from '@shell/components/fleet/FleetRepos';
import ResourceTabs from '@shell/components/form/ResourceTabs';
import Tab from '@shell/components/Tabbed/Tab';
import { MANAGEMENT, FLEET } from '@shell/config/types';
import { FLEET as FLEET_LABELS } from '@shell/config/labels-annotations';
import { allHash } from 'utils/promise';

export default {
  name: 'FleetDetailCluster',

  emits: ['input'],

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
    const managementClusterId = this.value?.metadata?.labels[FLEET_LABELS.CLUSTER_NAME];
    const hash = await allHash({
      rancherCluster: this.$store.dispatch('management/find', {
        type: MANAGEMENT.CLUSTER,
        id:   managementClusterId
      }),
      repos:             this.$store.dispatch('management/findAll', { type: FLEET.GIT_REPO }),
      workspaces:        this.$store.dispatch('management/findAll', { type: FLEET.WORKSPACE }),
      bundleDeployments: this.$store.dispatch('management/findAll', { type: FLEET.BUNDLE_DEPLOYMENT })
    });

    this.rancherCluster = hash.rancherCluster;
    this.allRepos = hash.repos;
  },

  data() {
    return { rancherCluster: null, allRepos: [] };
  },

  computed: {
    clusterId() {
      return this.value.id;
    },

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
    <h2
      v-t="'fleet.cluster.summary'"
      class="mt-20"
    />
    <ResourcesSummary :value="value.status.resourceCounts" />

    <ResourceTabs
      :value="value"
      mode="view"
      class="mt-20"
      @update:value="$emit('input', $event)"
    >
      <Tab
        label="Git Repos"
        name="repos"
        :weight="19"
      >
        <FleetRepos
          :clusterId="clusterId"
          :rows="repos"
          :schema="repoSchema"
          :paging="true"
          paging-label="sortableTable.paging.resource"
        />
      </Tab>
    </ResourceTabs>
  </div>
</template>
