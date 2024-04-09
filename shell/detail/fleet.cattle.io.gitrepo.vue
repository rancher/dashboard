<script>
import Loading from '@shell/components/Loading';
import ResourceTabs from '@shell/components/form/ResourceTabs';
import FleetSummary from '@shell/components/fleet/FleetSummary';
import { Banner } from '@components/Banner';
import FleetResources from '@shell/components/fleet/FleetResources';
import Tab from '@shell/components/Tabbed/Tab';
import { FLEET } from '@shell/config/types';
import { isHarvesterCluster } from '@shell/utils/cluster';
import FleetBundles from '@shell/components/fleet/FleetBundles.vue';
import FleetClusters from '@shell/components/fleet/FleetClusters.vue';
import { resourceCounts } from '@shell/components/ResourceSummary.vue';
import { checkSchemasForFindAllHash } from '@shell/utils/auth';

export default {
  name: 'DetailGitRepo',

  components: {
    Loading,
    FleetResources,
    FleetSummary,
    Banner,
    ResourceTabs,
    Tab,
    FleetBundles,
    FleetClusters,
  },

  props: {
    value: {
      type:     Object,
      required: true,
    },
  },

  data() {
    return {
      allFleetClusters:     [],
      allBundles:           [],
      allBundleDeployments: [],
    };
  },
  computed: {
    gitRepoHasClusters() {
      return this.value?.clusterResourceStatus?.length;
    },
    repoClustersFiltered() {
      if (this.gitRepoHasClusters) {
        return this.value?.clustersList.filter((cluster) => {
          return this.value.clusterResourceStatus.some((crsItem) => crsItem.clusterId === cluster.id);
        });
      }

      return [];
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
    const allDispatches = await checkSchemasForFindAllHash({
      allBundles: {
        inStoreType: 'management',
        type:        FLEET.BUNDLE
      },

      allBundleDeployments: {
        inStoreType: 'management',
        type:        FLEET.BUNDLE_DEPLOYMENT
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

    this.allBundleDeployments = allDispatches.allBundleDeployments || [];
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
      v-model="value"
      mode="view"
      class="mt-20"
      :need-related="false"
    >
      <Tab
        v-if="!!repoClustersFiltered.length"
        label="Clusters"
        name="clusters"
        :weight="40"
      >
        <FleetClusters
          :rows="repoClustersFiltered"
          :schema="clusterSchema"
          :paging="true"
          :table-actions="false"
          :search="false"
          paging-label="sortableTable.paging.resource"
        />
      </Tab>
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
