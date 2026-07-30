<script>
import { mapState } from 'vuex';
import ResourceTabs from '@shell/components/form/ResourceTabs';
import FleetSummary from '@shell/components/fleet/FleetSummary';
import { Banner } from '@components/Banner';
import FleetResources from '@shell/components/fleet/FleetResources';
import Tab from '@shell/components/Tabbed/Tab';
import { FLEET } from '@shell/config/types';
import { FLEET as FLEET_ANNOTATIONS } from '@shell/config/labels-annotations';
import FleetUtils from '@shell/utils/fleet';
import { isHarvesterCluster } from '@shell/utils/cluster';
import FleetBundles from '@shell/components/fleet/FleetBundles.vue';
import { checkSchemasForFindAllHash } from '@shell/utils/auth';
import {
  FilterArgs,
  PaginationParamFilter,
  PaginationParamProjectOrNamespace,
  PaginationFilterEquality,
} from '@shell/types/store/pagination.types';
import DetailPage from '@shell/components/Resource/Detail/Page.vue';
import Masthead from '@shell/components/Resource/Detail/Masthead/index.vue';
import { useDefaultMastheadProps } from '@shell/components/Resource/Detail/Masthead/composable';
import ViewOptions from '@shell/components/Resource/Detail/ViewOptions/index.vue';
import { useCurrentView } from '@shell/components/Resource/Detail/ViewOptions/composable';
import { _GRAPH } from '@shell/config/query-params';
import ForceDirectedTreeChart from '@shell/components/ForceDirectedTreeChart';
import { useDefaultForceDirectTreeChartProps } from '@shell/components/ForceDirectedTreeChart/composable';

export default {
  name: 'DetailsHelmOp',

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
      clusters:          [],
      allBundles:        [],
      bundleDeployments: [],
    };
  },

  created() {
    if (this.workspace !== this.value.namespace) {
      this.$store.commit('updateWorkspace', { value: this.value.namespace, getters: this.$store.getters });
    }
  },

  computed: {
    ...mapState(['workspace']),
    helmOpHasClusters() {
      return this.value.status?.desiredReadyClusters;
    },
    harvesterClusters() {
      const harvester = {};

      this.clusters.forEach((c) => {
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

    // Resources deployed by this HelmOp, derived from its BundleDeployments (same approach as the
    // Bundle detail page). Each BD carries its cluster id in its labels, so we don't need the app's
    // targetClusters - and therefore not the all-cluster / all-cluster-group fetch it required.
    resources() {
      const bdByClusterId = (this.bundleDeployments || []).reduce((res, bd) => {
        res[FleetUtils.clusterIdFromBundleDeploymentLabels(bd.metadata?.labels)] = bd;

        return res;
      }, {});

      return (this.clusters || []).reduce((res, cluster) => {
        const bd = bdByClusterId[cluster.id];

        if (bd) {
          FleetUtils.resourcesFromBundleDeploymentStatus(bd.status).forEach((r) => {
            const type = FleetUtils.resourceType(r);
            const key = `${ cluster.id }-${ type }-${ r.namespace }-${ r.name }`;

            res.push({
              ...r,
              key,
              type,
              id:             FleetUtils.resourceId(r),
              clusterId:      cluster.id,
              clusterName:    cluster.nameDisplay,
              detailLocation: FleetUtils.detailLocation(r, cluster.metadata.labels[FLEET_ANNOTATIONS.CLUSTER_NAME]),
            });
          });
        }

        return res;
      }, []);
    },
  },
  async fetch() {
    // Bundles power the FleetSummary + Bundles tab.
    try {
      const hash = await checkSchemasForFindAllHash({
        allBundles: {
          inStoreType: 'management',
          type:        FLEET.BUNDLE,
          opt:         { excludeFields: ['metadata.managedFields', 'spec.resources'] },
        },
      }, this.$store);

      this.allBundles = hash.allBundles || [];
    } catch (e) {
    }

    // This HelmOp's BundleDeployments drive the Resources tab and name exactly which clusters are
    // involved (their cluster id is in the labels).
    try {
      this.bundleDeployments = await this.$store.dispatch('management/findLabelSelector', {
        type:     FLEET.BUNDLE_DEPLOYMENT,
        matching: { labelSelector: { matchLabels: { [FLEET_ANNOTATIONS.HELM_NAME]: this.value.name } } },
      }) || [];
    } catch (e) {
      this.bundleDeployments = [];
    }

    // Only the clusters those deployments reference, fetched by id (resource display + harvester).
    this.clusters = await this.fetchClustersForDeployments();
  },

  methods: {
    async fetchClustersForDeployments() {
      const ids = [...new Set(
        (this.bundleDeployments || [])
          .map((bd) => FleetUtils.clusterIdFromBundleDeploymentLabels(bd.metadata?.labels))
          .filter((id) => id && id.includes('/'))
      )];

      if (!ids.length) {
        return [];
      }

      const namespaces = [...new Set(ids.map((id) => id.split('/')[0]))];
      const names = [...new Set(ids.map((id) => id.split('/')[1]))];

      try {
        return await this.$store.dispatch('management/findPage', {
          type: FLEET.CLUSTER,
          opt:  {
            pagination: new FilterArgs({
              projectsOrNamespaces: new PaginationParamProjectOrNamespace({ projectOrNamespace: namespaces }),
              filters:              PaginationParamFilter.createSingleField({
                field: 'metadata.name', value: names.join(','), equality: PaginationFilterEquality.IN
              }),
            })
          }
        }) || [];
      } catch (e) {
        // Fallback (e.g. pagination api unavailable): namespace-scoped list, still far narrower
        // than every cluster in the cluster.
        try {
          return await this.$store.dispatch('management/findAll', { type: FLEET.CLUSTER, opt: { namespaced: namespaces[0] } }) || [];
        } catch (e2) {
          return [];
        }
      }
    },
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
        <div class="mt-20">
          <FleetSummary
            v-if="helmOpHasClusters"
            :value="value"
            :bundles="bundles"
            class="mb-20"
          />
          <Banner
            v-else
            color="info"
            class="mb-20"
          >
            {{ t('fleet.fleetSummary.noClusters.helmOp') }}
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
              <FleetBundles
                :value="value"
                :clusters="clusters"
              />
            </Tab>
            <Tab
              label="Resources"
              name="resources"
              :weight="20"
            >
              <FleetResources :rows="resources" />
            </Tab>
          </ResourceTabs>
        </div>
      </template>
    </template>
  </DetailPage>
</template>
