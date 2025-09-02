<script>
import Loading from '@shell/components/Loading';
import ResourcesSummary from '@shell/components/fleet/ResourcesSummary';
import FleetApplications from '@shell/components/fleet/FleetApplications';
import ResourceTabs from '@shell/components/form/ResourceTabs';
import Tab from '@shell/components/Tabbed/Tab';
import { MANAGEMENT, FLEET, SCHEMA } from '@shell/config/types';
import { FLEET as FLEET_LABELS } from '@shell/config/labels-annotations';
import { allHash } from 'utils/promise';

export default {
  name: 'FleetDetailCluster',

  emits: ['input'],

  components: {
    Loading,
    ResourcesSummary,
    FleetApplications,
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
      gitRepos:          this.$store.dispatch('management/findAll', { type: FLEET.GIT_REPO }),
      helmOps:           this.$store.dispatch('management/findAll', { type: FLEET.HELM_OP }),
      workspaces:        this.$store.dispatch('management/findAll', { type: FLEET.WORKSPACE }),
      clusterGroups:     this.$store.dispatch('management/findAll', { type: FLEET.CLUSTER_GROUP }), // Needed for calculating targetClusters
      bundleDeployments: this.$store.dispatch('management/findAll', { type: FLEET.BUNDLE_DEPLOYMENT })
    });

    this.rancherCluster = hash.rancherCluster;
    this.gitRepos = hash.gitRepos;
    this.helmOps = hash.helmOps;
  },

  data() {
    return {
      rancherCluster: null,
      gitRepos:       [],
      helmOps:        [],
      appSchema:      {
        id:   FLEET.APPLICATION,
        type: SCHEMA,
      },
    };
  },

  computed: {
    clusterId() {
      return this.value.id;
    },

    rows() {
      return [
        ...this.gitRepos,
        ...this.helmOps
      ].filter((resource) => {
        return !!resource.targetClusters.find((c) => c.id === this.clusterId);
      });
    },

    typeLabel() {
      return this.t(`typeLabel."${ FLEET.APPLICATION }"`, { count: 2 });
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
        :label="typeLabel"
        name="applications"
        :weight="19"
      >
        <FleetApplications
          :clusterId="clusterId"
          :rows="rows"
          :schema="appSchema || {}"
          :paging="true"
          paging-label="sortableTable.paging.resource"
        />
      </Tab>
    </ResourceTabs>
  </div>
</template>
