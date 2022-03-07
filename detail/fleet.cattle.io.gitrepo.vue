<script>
import ResourceTabs from '@/components/form/ResourceTabs';
import FleetSummary from '@/components/fleet/FleetSummary';
import Banner from '@/components/Banner';
import FleetResources from '@/components/fleet/FleetResources';
import Tab from '@/components/Tabbed/Tab';
import { FLEET } from '@/config/types';
import { isHarvesterCluster } from '@/utils/cluster';
import FleetBundles from '@/components/fleet/FleetBundles.vue';
import { resourceCounts } from '@/components/ResourceSummary.vue';
import { allHash } from '~/utils/promise';

export default {
  name: 'DetailGitRepo',

  components: {
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
      allFleet:   [],
      allBundles: [],
    };
  },

  computed: {

    gitRepoHasClusters() {
      return this.value.status.desiredReadyClusters;
    },
    harvesterClusters() {
      const harvester = {};

      this.allFleet.forEach((c) => {
        if (isHarvesterCluster(c)) {
          harvester[c.metadata.name] = c;
        }
      });

      return harvester;
    },

    bundleCounts() {
      return resourceCounts(this.$store, FLEET.BUNDLE);
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
    const { $store } = this;

    const allDispatches = await allHash({
      allBundles:     $store.dispatch('management/findAll', { type: FLEET.BUNDLE }),
      allFleet:       $store.dispatch('management/findAll', { type: FLEET.CLUSTER }),
      clusterGroups:  $store.dispatch('management/findAll', { type: FLEET.CLUSTER_GROUP }),
    });

    this.allBundles = allDispatches.allBundles;
    this.allFleet = allDispatches.allFleet;

    console.log('ALL FLEET', this.allFleet);
  },

};
</script>

<template>
  <div class="mt-20">
    <FleetSummary
      v-if="gitRepoHasClusters"
      :value="value"
      :bundles="bundles"
    />
    <Banner
      v-else
      color="info"
      class="mb-40"
    >
      {{ t('fleet.fleetSummary.noClustersGitRepo') }}
    </Banner>
    <ResourceTabs v-model="value" mode="view" class="mt-20">
      <Tab label="Bundles" name="bundles" :weight="30">
        <FleetBundles :value="value" />
      </Tab>
      <Tab label="Resources" name="resources" :weight="20">
        <FleetResources :value="value" />
      </Tab>
    </ResourceTabs>
  </div>
</template>
