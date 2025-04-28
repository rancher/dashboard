<script>
import Loading from '@shell/components/Loading';
import ResourceTabs from '@shell/components/form/ResourceTabs';
import FleetSummary from '@shell/components/fleet/FleetSummary';
import { Banner } from '@components/Banner';
import FleetResources from '@shell/components/fleet/FleetResources';
import Tab from '@shell/components/Tabbed/Tab';
import { FLEET, MANAGEMENT } from '@shell/config/types';
import { isHarvesterCluster } from '@shell/utils/cluster';
import FleetBundles from '@shell/components/fleet/FleetBundles.vue';
import { checkSchemasForFindAllHash } from '@shell/utils/auth';

export default {
  name: 'DetailGitRepo',

  emits: ['input'],

  components: {
    Loading,
    FleetResources,
    FleetSummary,
    Banner,
    ResourceTabs,
    Tab,
    FleetBundles,
  },

  props: {
    value: {
      type:     Object,
      required: true,
    },
  },

  data() {
    return {
      allFleetClusters: [],
      allBundles:       [],
    };
  },
  computed: {
    gitRepoHasClusters() {
      return this.value.status?.desiredReadyClusters;
    },
    clusterSchema() {
      return this.$store.getters['management/schemaFor'](FLEET.CLUSTER);
    },
    harvesterClusters() {
      const harvester = {};

      this.allFleetClusters.forEach((c) => {
        if (isHarvesterCluster(c)) {
          harvester[c.metadata.name] = c;
        }
      });

      return harvester;
    },
    bundles() {
      const harvester = this.harvesterClusters;

      const bundles = this.allBundles.filter((bundle) => {
        const targets = bundle.spec?.targets || [];

        // Filter out any bundle that has one target whose cluster is a harvester cluster
        if (targets.length === 1) {
          return !harvester[targets[0].clusterName];
        }

        return true;
      });

      return bundles;
    },
  },
  async fetch() {
    const allDispatches = await checkSchemasForFindAllHash({
      allBundles: {
        inStoreType: 'management',
        type:        FLEET.BUNDLE,
        opt:         { excludeFields: ['metadata.managedFields', 'spec.resources'] },
      },

      allFleetClusters: {
        inStoreType: 'management',
        type:        FLEET.CLUSTER
      },
      clusterGroups: {
        inStoreType: 'management',
        type:        FLEET.CLUSTER_GROUP
      }
    }, this.$store);

    if (this.value.authorId && this.$store.getters['management/schemaFor'](MANAGEMENT.USER)) {
      await this.$store.dispatch(`management/findAll`, { type: MANAGEMENT.USER }, { root: true });
    }

    this.allBundles = allDispatches.allBundles || [];
    this.allFleetClusters = allDispatches.allFleetClusters || [];
  },

};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div
    v-else
    class="mt-20"
  >
    <FleetSummary
      v-if="gitRepoHasClusters"
      :value="value"
      :bundles="bundles"
      class="mb-20"
    />
    <Banner
      v-else
      color="info"
      class="mb-20"
    >
      {{ t('fleet.fleetSummary.noClustersGitRepo') }}
    </Banner>
    <ResourceTabs
      :value="value"
      mode="view"
      class="mt-20"
      :need-related="false"
      @update:value="$emit('input', $event)"
    >
      <Tab
        v-if="!!allBundles.length"
        label="Bundles"
        name="bundles"
        :weight="30"
      >
        <FleetBundles :value="value" />
      </Tab>
      <Tab
        label="Resources"
        name="resources"
        :weight="20"
      >
        <FleetResources :value="value" />
      </Tab>
    </ResourceTabs>
  </div>
</template>
