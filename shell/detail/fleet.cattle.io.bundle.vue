<script>
import { FLEET } from '@shell/config/types';
import FleetResources from '@shell/components/fleet/FleetResources';
import FleetUtils from '@shell/utils/fleet';
import { checkSchemasForFindAllHash } from '@shell/utils/auth';
import Loading from '@shell/components/Loading.vue';
import { FLEET as FLEET_ANNOTATIONS } from '@shell/config/labels-annotations';

export default {
  name: 'FleetBundleDetail',

  components: { Loading, FleetResources },
  props:      {
    value: {
      type:     Object,
      required: true,
    }
  },

  data() {
    return { allBundleDeployments: [] };
  },

  async fetch() {
    const allDispatches = await checkSchemasForFindAllHash({
      allBundleDeployments: {
        inStoreType: 'management',
        type:        FLEET.BUNDLE_DEPLOYMENT,
      },

      // must be loaded for bundle.targetClusters to work
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
  },

  computed: {
    bundleResources() {
      if (!this.allBundleDeployments) {
        return [];
      }

      const bundleDeploymentsByClusterId = this.allBundleDeployments
        .reduce((res, bd) => {
          if (this.value.id === FleetUtils.bundleIdFromBundleDeploymentLabels(bd.metadata?.labels)) {
            res[FleetUtils.clusterIdFromBundleDeploymentLabels(bd.metadata?.labels)] = bd;
          }

          return res;
        }, {});

      return this.value.targetClusters.reduce((res, cluster) => {
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
    resourceCount() {
      return this.bundleResources.length;
    },
  }
};

</script>

<template>
  <div>
    <div class="bundle-title mt-20 mb-20">
      <h2>{{ t('fleet.bundles.resources') }}</h2>
      <span>{{ resourceCount }}</span>
    </div>
    <Loading v-if="$fetchState.pending" />
    <FleetResources
      v-else
      :rows="bundleResources"
    />
  </div>
</template>

<style lang="scss" scoped>
.bundle-title {
  display: flex;
  align-items: center;

  h2 {
    margin: 0 10px 0 0;
  }

  span {
    background-color: var(--darker);
    color: var(--default);
    padding: 5px 10px;
    border-radius: 15px;
  }
}
</style>
