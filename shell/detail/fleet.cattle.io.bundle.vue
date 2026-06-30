<script>
import { FLEET } from '@shell/config/types';
import FleetResources from '@shell/components/fleet/FleetResources';
import FleetUtils from '@shell/utils/fleet';
import Loading from '@shell/components/Loading.vue';
import { FLEET as FLEET_ANNOTATIONS } from '@shell/config/labels-annotations';
import ResourceTabs from '@shell/components/form/ResourceTabs';
import Tab from '@shell/components/Tabbed/Tab';
import {
  FilterArgs,
  PaginationParamFilter,
  PaginationParamProjectOrNamespace,
  PaginationFilterEquality,
} from '@shell/types/store/pagination.types';

export default {
  name: 'FleetBundleDetail',

  components: {
    Loading, FleetResources, ResourceTabs, Tab
  },
  props: {
    value: {
      type:     Object,
      required: true,
    }
  },

  data() {
    return { allBundleDeployments: [], clusters: [] };
  },

  async fetch() {
    // Only this bundle's deployments (server-side filtered by the bundle-name / bundle-namespace
    // labels) rather than every BundleDeployment in the cluster. findLabelSelector uses the
    // paginated sql-cache api when available and falls back to a native labelSelector list.
    try {
      this.allBundleDeployments = await this.$store.dispatch('management/findLabelSelector', {
        type:     FLEET.BUNDLE_DEPLOYMENT,
        matching: {
          labelSelector: {
            matchLabels: {
              [FLEET_ANNOTATIONS.BUNDLE_NAME]:      this.value.metadata.name,
              [FLEET_ANNOTATIONS.BUNDLE_NAMESPACE]: this.value.metadata.namespace,
            }
          }
        },
      }) || [];
    } catch (e) {
      this.allBundleDeployments = [];
    }

    // The deployments already name the clusters they target (in their labels), so fetch only those
    // clusters - by id - for display. This drops the previous "all clusters" + "all cluster-groups"
    // findAll (cluster-groups only existed to resolve bundle.targetClusters, no longer needed here).
    this.clusters = await this.fetchClustersForDeployments();
  },

  methods: {
    async fetchClustersForDeployments() {
      const ids = [...new Set(
        (this.allBundleDeployments || [])
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
        // Fallback (e.g. pagination api unavailable): namespace-scoped list - still far narrower
        // than every cluster in the cluster.
        try {
          return await this.$store.dispatch('management/findAll', { type: FLEET.CLUSTER, opt: { namespaced: namespaces[0] } }) || [];
        } catch (e2) {
          return [];
        }
      }
    },
  },

  computed: {
    bundleResources() {
      const bundleDeploymentsByClusterId = (this.allBundleDeployments || [])
        .reduce((res, bd) => {
          res[FleetUtils.clusterIdFromBundleDeploymentLabels(bd.metadata?.labels)] = bd;

          return res;
        }, {});

      // Drive off the clusters the deployments actually reference (fetched by id), not
      // value.targetClusters - so the page no longer needs every cluster loaded to resolve targets.
      return (this.clusters || []).reduce((res, cluster) => {
        const bd = bundleDeploymentsByClusterId[cluster.id];

        if (bd) {
          FleetUtils.resourcesFromBundleDeploymentStatus(bd.status)
            .forEach((r) => {
              const type = FleetUtils.resourceType(r);
              const key = `${ cluster.id }-${ type }-${ r.namespace }-${ r.name }`;

              res.push({
                ...r,
                key,
                type,
                id:          FleetUtils.resourceId(r),
                clusterId:   cluster.id,
                clusterName: cluster.nameDisplay,

                detailLocation: FleetUtils.detailLocation(r, cluster.metadata.labels[FLEET_ANNOTATIONS.CLUSTER_NAME]),
              });
            });
        }

        return res;
      }, []);
    },
  }
};

</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <ResourceTabs
    v-else
    :value="value"
    mode="view"
    :need-related="false"
  >
    <Tab
      label="Resources"
      name="resources"
      :weight="20"
    >
      <FleetResources :rows="bundleResources" />
    </Tab>
  </ResourceTabs>
</template>
