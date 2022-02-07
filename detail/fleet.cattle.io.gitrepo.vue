<script>
import ResourceTabs from '@/components/form/ResourceTabs';
import FleetSummary from '@/components/fleet/FleetSummary';
import FleetResources from '@/components/fleet/FleetResources';
import Tab from '@/components/Tabbed/Tab';
import { FLEET } from '@/config/types';
import { isHarvesterCluster } from '@/utils/cluster';
import { resourceCounts } from '~/components/ResourceSummary.vue';

export default {
  name: 'DetailGitRepo',

  components: {
    FleetResources,
    FleetSummary,
    ResourceTabs,
    Tab,
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

      return bundles
    },
  },
  async fetch() {
    this.allBundles = await this.$store.dispatch('management/findAll', { type: FLEET.BUNDLE });
    this.allFleet = await this.$store.dispatch('management/findAll', { type: FLEET.CLUSTER });
    await this.$store.dispatch('management/findAll', { type: FLEET.CLUSTER });
    await this.$store.dispatch('management/findAll', { type: FLEET.CLUSTER_GROUP });
  },
};
</script>

<template>
  <div class="mt-20">
    {{bundleCounts}}
    <FleetSummary :value="value.status.resourceCounts" :bundle="bundles" />

    <ResourceTabs v-model="value" mode="view" class="mt-20">
      <Tab label="Resources" name="resources" :weight="20">
        <FleetResources :value="value" />
      </Tab>
    </ResourceTabs>
  </div>
</template>
