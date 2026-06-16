<script>
import { mapState } from 'vuex';
import ResourceTabs from '@shell/components/form/ResourceTabs';
import FleetSummary from '@shell/components/fleet/FleetSummary';
import { Banner } from '@components/Banner';
import FleetResources from '@shell/components/fleet/FleetResources';
import Tab from '@shell/components/Tabbed/Tab';
import { FLEET } from '@shell/config/types';
import { isHarvesterCluster } from '@shell/utils/cluster';
import FleetBundles from '@shell/components/fleet/FleetBundles.vue';
import { checkSchemasForFindAllHash } from '@shell/utils/auth';
import DetailPage from '@shell/components/Resource/Detail/Page.vue';
import Masthead from '@shell/components/Resource/Detail/Masthead/index.vue';
import { useDefaultMastheadProps } from '@shell/components/Resource/Detail/Masthead/composable';
import ViewOptions from '@shell/components/Resource/Detail/ViewOptions/index.vue';
import { useCurrentView } from '@shell/components/Resource/Detail/ViewOptions/composable';
import { _GRAPH } from '@shell/config/query-params';
import ForceDirectedTreeChart from '@shell/components/ForceDirectedTreeChart';
import { useDefaultForceDirectTreeChartProps } from '@shell/components/ForceDirectedTreeChart/composable';

export default {
  name: 'DetailGitRepo',

  emits: ['input'],

  components: {
    FleetResources,
    FleetSummary,
    Banner,
    ResourceTabs,
    Tab,
    FleetBundles,
    DetailPage,
    Masthead,
    ViewOptions,
    ForceDirectedTreeChart
  },

  props: {
    value: {
      type:     Object,
      required: true,
    },
  },

  setup(props) {
    const defaultMastheadProps = useDefaultMastheadProps(props.value);
    const currentView = useCurrentView();
    const forceDirectedTreeChartProps = useDefaultForceDirectTreeChartProps(props.value);

    return {
      defaultMastheadProps, currentView, forceDirectedTreeChartProps, _GRAPH
    };
  },

  data() {
    return {
      allFleetClusters: [],
      allBundles:       [],
    };
  },

  created() {
    if (this.workspace !== this.value.namespace) {
      this.$store.commit('updateWorkspace', { value: this.value.namespace, getters: this.$store.getters });
    }
  },

  computed: {
    ...mapState(['workspace']),
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

    this.allBundles = allDispatches.allBundles || [];
    this.allFleetClusters = allDispatches.allFleetClusters || [];
  },

};
</script>

<template>
  <DetailPage :loading="$fetchState.pending">
    <template #top-area>
      <Masthead v-bind="defaultMastheadProps">
        <template #additional-actions>
          <ViewOptions />
        </template>
      </Masthead>
    </template>
    <template #bottom-area>
      <template v-if="currentView === _GRAPH">
        <ForceDirectedTreeChart v-bind="forceDirectedTreeChartProps" />
      </template>

      <template v-else>
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
          {{ t('fleet.fleetSummary.noClusters.gitRepo') }}
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
            <FleetResources :rows="value.resourcesStatuses" />
          </Tab>
        </ResourceTabs>
      </template>
    </template>
  </DetailPage>
</template>
