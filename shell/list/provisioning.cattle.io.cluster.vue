<script>
import { Banner } from '@components/Banner';
import ResourceTable from '@shell/components/ResourceTable';
import Masthead from '@shell/components/ResourceList/Masthead';
import { allHash } from '@shell/utils/promise';
import { CAPI, MANAGEMENT, SNAPSHOT, NORMAN } from '@shell/config/types';
import { MODE, _IMPORT } from '@shell/config/query-params';
import { filterOnlyKubernetesClusters, filterHiddenLocalCluster } from '@shell/utils/cluster';
import { mapFeature, HARVESTER as HARVESTER_FEATURE } from '@shell/store/features';
import { NAME as EXPLORER } from '@shell/config/product/explorer';
import { BadgeState } from '@components/BadgeState';

export default {
  components: {
    Banner, ResourceTable, Masthead, BadgeState
  },

  async fetch() {
    const hash = {
      normanClusters:  this.$store.dispatch('rancher/findAll', { type: NORMAN.CLUSTER }),
      mgmtClusters:    this.$store.dispatch('management/findAll', { type: MANAGEMENT.CLUSTER }),
      rancherClusters: this.$store.dispatch('management/findAll', { type: CAPI.RANCHER_CLUSTER }),
    };

    if ( this.$store.getters['management/canList'](SNAPSHOT) ) {
      hash.etcdSnapshots = this.$store.dispatch('management/findAll', { type: SNAPSHOT });
    }

    if ( this.$store.getters['management/canList'](MANAGEMENT.NODE) ) {
      hash.mgmtNodes = this.$store.dispatch('management/findAll', { type: MANAGEMENT.NODE });
    }

    if ( this.$store.getters['management/canList'](MANAGEMENT.NODE_POOL) ) {
      hash.mgmtPools = this.$store.dispatch('management/findAll', { type: MANAGEMENT.NODE_POOL });
    }

    if ( this.$store.getters['management/canList'](MANAGEMENT.NODE_TEMPLATE) ) {
      hash.mgmtTemplates = this.$store.dispatch('management/findAll', { type: MANAGEMENT.NODE_TEMPLATE });
    }

    if ( this.$store.getters['management/canList'](CAPI.MACHINE_DEPLOYMENT) ) {
      hash.machineDeployments = this.$store.dispatch('management/findAll', { type: CAPI.MACHINE_DEPLOYMENT });
    }

    // Fetch RKE template revisions so we can show when an updated template is available
    // This request does not need to be blocking
    if ( this.$store.getters['management/canList'](MANAGEMENT.RKE_TEMPLATE_REVISION) ) {
      this.$store.dispatch('management/findAll', { type: MANAGEMENT.RKE_TEMPLATE_REVISION });
    }

    const res = await allHash(hash);

    this.mgmtClusters = res.mgmtClusters;
    this.rancherClusters = res.rancherClusters;
  },

  data() {
    return {
      resource:        CAPI.RANCHER_CLUSTER,
      schema:          this.$store.getters['management/schemaFor'](CAPI.RANCHER_CLUSTER),
      mgmtClusters:    [],
      rancherClusters: [],
    };
  },

  computed: {
    rows() {
      // If Harvester feature is enabled, hide Harvester Clusters
      if (this.harvesterEnabled) {
        return filterHiddenLocalCluster(filterOnlyKubernetesClusters(this.rancherClusters), this.$store);
      }

      // Otherwise, show Harvester clusters - these will be shown with a warning
      return filterHiddenLocalCluster(this.rancherClusters, this.$store);
    },

    hiddenHarvesterCount() {
      const product = this.$store.getters['currentProduct'];
      const isExplorer = product?.name === EXPLORER;

      // Don't show Harvester banner message on the cluster management page or if Harvester if not enabled
      if (!isExplorer || !this.harvesterEnabled) {
        return 0;
      }

      return this.rancherClusters.length - filterOnlyKubernetesClusters(this.rancherClusters).length;
    },

    createLocation() {
      return {
        name:   'c-cluster-product-resource-create',
        params: {
          product:  this.$store.getters['currentProduct'].name,
          resource: this.resource
        },
      };
    },

    importLocation() {
      return {
        name:   'c-cluster-product-resource-create',
        params: {
          product:  this.$store.getters['currentProduct'].name,
          resource: this.resource
        },
        query: { [MODE]: _IMPORT }
      };
    },

    canImport() {
      const schema = this.$store.getters['management/schemaFor'](CAPI.RANCHER_CLUSTER);

      return !!schema?.collectionMethods.find(x => x.toLowerCase() === 'post');
    },

    harvesterEnabled: mapFeature(HARVESTER_FEATURE),
  },

  mounted() {
    window.c = this;
  },
};
</script>

<template>
  <div>
    <Banner v-if="hiddenHarvesterCount" color="info" :label="t('cluster.harvester.clusterWarning', {count: hiddenHarvesterCount} )" />

    <Masthead
      :schema="schema"
      :resource="resource"
      :create-location="createLocation"
      component-testid="cluster-manager-list"
    >
      <template v-if="canImport" slot="extraActions">
        <n-link
          :to="importLocation"
          class="btn role-primary"
          data-testid="cluster-manager-list-import"
        >
          {{ t('cluster.importAction') }}
        </n-link>
      </template>
    </Masthead>

    <ResourceTable :schema="schema" :rows="rows" :namespaced="false" :loading="$fetchState.pending">
      <!-- Why are state column and subrow overwritten here? -->
      <!-- for rke1 clusters, where they try to use the mgmt cluster stateObj instead of prov cluster stateObj,  -->
      <!-- updates were getting lost. This isn't performant as normal columns, but the list shouldn't grow -->
      <!-- big enough for the performance to matter -->
      <template #cell:state="{row}">
        <BadgeState :color="row.stateBackground" :label="row.stateDisplay" />
      </template>
      <template #sub-row="{fullColspan, row, keyField, componentTestid, i, onRowMouseEnter, onRowMouseLeave}">
        <tr
          v-if="row.stateDescription"
          :key="row[keyField] + '-description'"
          :data-testid="componentTestid + '-' + i + '-row-description'"
          class="state-description sub-row"
          @mouseenter="onRowMouseEnter"
          @mouseleave="onRowMouseLeave"
        >
          <td>&nbsp;</td>
          <td :colspan="fullColspan - 1" :class="{ 'text-error' : row.stateObj.error }">
            {{ row.stateDescription }}
          </td>
        </tr>
      </template>
      <template #cell:summary="{row}">
        <span v-if="!row.stateParts.length">{{ row.nodes.length }}</span>
      </template>
      <template #cell:explorer="{row}">
        <span v-if="row.mgmt && row.mgmt.isHarvester"></span>
        <n-link
          v-else-if="row.mgmt && row.mgmt.isReady"
          data-testid="cluster-manager-list-explore-management"
          class="btn btn-sm role-secondary"
          :to="{name: 'c-cluster', params: {cluster: row.mgmt.id}}"
        >
          {{ t('cluster.exploreHarvester') }}
        </n-link>
        <button
          v-else
          data-testid="cluster-manager-list-explore"
          :disabled="true"
          class="btn btn-sm role-secondary"
        >
          {{ t('cluster.explore') }}
        </button>
      </template>
    </ResourceTable>
  </div>
</template>
