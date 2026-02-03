<script>
import { CAPI, MANAGEMENT } from '@shell/config/types';

export default {
  props: {
    row: {
      type:     Object,
      required: true
    },
    value: {
      type:    Array,
      default: () => []
    }
  },

  computed: {
    clusters() {
      const clusterIds = this.row?.spec?.clusters || this.value || [];
      // Kubeconfig stores management cluster IDs, so look up provisioning clusters by mgmtClusterId
      const provClusters = this.$store.getters['management/all'](CAPI.RANCHER_CLUSTER) || [];
      const mgmtClusters = this.$store.getters['management/all'](MANAGEMENT.CLUSTER) || [];

      const mapped = clusterIds.map((id) => {
        // First try to find provisioning cluster by management cluster ID
        const provCluster = provClusters.find((c) => c.mgmt?.id === id || c.status?.clusterName === id);
        // Also check management clusters directly for name display
        const mgmtCluster = mgmtClusters.find((c) => c.id === id);

        // Always prefer provisioning cluster for the link
        if (provCluster) {
          return {
            id,
            name:     provCluster.nameDisplay,
            exists:   true,
            location: provCluster.detailLocation
          };
        }

        // Management cluster exists but no provisioning cluster found
        // Still link to provisioning cluster route if possible
        if (mgmtCluster) {
          // Find provisioning cluster by management cluster's spec.fleetWorkspaceName and name
          const provClusterForMgmt = provClusters.find((c) => c.mgmt?.id === mgmtCluster.id);

          return {
            id,
            name:     mgmtCluster.nameDisplay,
            exists:   true,
            location: provClusterForMgmt?.detailLocation || mgmtCluster.detailLocation
          };
        }

        return {
          id,
          name:   id,
          exists: false
        };
      });

      // Sort: existing clusters first (by name), then deleted clusters (by id)
      return mapped.sort((a, b) => {
        // Existing clusters come before deleted ones
        if (a.exists && !b.exists) {
          return -1;
        }
        if (!a.exists && b.exists) {
          return 1;
        }

        // Both exist or both deleted: sort alphanumerically
        const aName = (a.exists ? a.name : a.id).toLowerCase();
        const bName = (b.exists ? b.name : b.id).toLowerCase();

        return aName.localeCompare(bName, undefined, { numeric: true });
      });
    }
  }
};
</script>

<template>
  <span class="kubeconfig-clusters">
    <template
      v-for="(cluster, index) in clusters"
    >
      <template v-if="index > 0">, </template>
      <router-link
        v-if="cluster.exists"
        :key="cluster.id"
        :to="cluster.location"
      >
        {{ cluster.name }}
      </router-link>
      <span
        v-else
        :key="`${cluster.id}-deleted`"
        class="text-muted"
      >
        {{ cluster.id }} (deleted)
      </span>
    </template>
    <span
      v-if="clusters.length === 0"
      class="text-muted"
    >
      &mdash;
    </span>
  </span>
</template>

<style lang="scss" scoped>
.kubeconfig-clusters {
  display: inline;
}
</style>
