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
import ResourceFetch from '@shell/mixins/resource-fetch';
import { BadgeState } from '@components/BadgeState';
import CloudCredExpired from '@shell/components/formatter/CloudCredExpired';

export default {
  components: {
    Banner, ResourceTable, Masthead, BadgeState, CloudCredExpired
  },
  mixins: [ResourceFetch],
  props:  {
    loadIndeterminate: {
      type:    Boolean,
      default: false
    },

    incrementalLoadingIndicator: {
      type:    Boolean,
      default: false
    },

    useQueryParamsForSimpleFiltering: {
      type:    Boolean,
      default: false
    }
  },

  async fetch() {
    this.$initializeFetchData(CAPI.RANCHER_CLUSTER);
    const hash = {
      rancherClusters: this.$fetchType(CAPI.RANCHER_CLUSTER),
      normanClusters:  this.$fetchType(NORMAN.CLUSTER, [], 'rancher'),
      mgmtClusters:    this.$fetchType(MANAGEMENT.CLUSTER),
    };

    this.$store.dispatch('rancher/findAll', { type: NORMAN.CLOUD_CREDENTIAL });

    if ( this.$store.getters['management/canList'](SNAPSHOT) ) {
      hash.etcdSnapshots = this.$fetchType(SNAPSHOT);
    }

    if ( this.$store.getters['management/canList'](CAPI.MACHINE) ) {
      hash.capiMachines = this.$fetchType(CAPI.MACHINE);
    }

    if ( this.$store.getters['management/canList'](MANAGEMENT.NODE) ) {
      hash.mgmtNodes = this.$fetchType(MANAGEMENT.NODE);
    }

    if ( this.$store.getters['management/canList'](MANAGEMENT.NODE_POOL) ) {
      hash.mgmtPools = this.$fetchType(MANAGEMENT.NODE_POOL);
    }

    if ( this.$store.getters['management/canList'](MANAGEMENT.NODE_TEMPLATE) ) {
      hash.mgmtTemplates = this.$fetchType(MANAGEMENT.NODE_TEMPLATE);
    }

    if ( this.$store.getters['management/canList'](CAPI.MACHINE_DEPLOYMENT) ) {
      hash.machineDeployments = this.$fetchType(CAPI.MACHINE_DEPLOYMENT);
    }

    // Fetch RKE template revisions so we can show when an updated template is available
    // This request does not need to be blocking
    if ( this.$store.getters['management/canList'](MANAGEMENT.RKE_TEMPLATE_REVISION) ) {
      this.$fetchType(MANAGEMENT.RKE_TEMPLATE_REVISION);
    }

    const res = await allHash(hash);

    this.mgmtClusters = res.mgmtClusters;
    this.showRke1DeprecationWarning = this.rows.some((r) => r.isRke1);
  },

  data() {
    return {
      resource:                   CAPI.RANCHER_CLUSTER,
      schema:                     this.$store.getters['management/schemaFor'](CAPI.RANCHER_CLUSTER),
      mgmtClusters:               [],
      showRke1DeprecationWarning: false
    };
  },

  computed: {
    filteredRows() {
      // If Harvester feature is enabled, hide Harvester Clusters
      if (this.harvesterEnabled) {
        return filterHiddenLocalCluster(filterOnlyKubernetesClusters(this.rows, this.$store), this.$store);
      }

      // Otherwise, show Harvester clusters - these will be shown with a warning
      return filterHiddenLocalCluster(this.rows, this.$store);
    },

    hiddenHarvesterCount() {
      const product = this.$store.getters['currentProduct'];
      const isExplorer = product?.name === EXPLORER;

      // Don't show Harvester banner message on the cluster management page or if Harvester if not enabled
      if (!isExplorer || !this.harvesterEnabled) {
        return 0;
      }

      return this.rows.length - filterOnlyKubernetesClusters(this.rows, this.$store).length;
    },

    createLocation() {
      const options = this.$store.getters[`type-map/optionsFor`](this.resource)?.custom || {};
      const params = {
        product:  this.$store.getters['currentProduct'].name,
        resource: this.resource
      };
      const defaultLocation = {
        name: 'c-cluster-product-resource-create',
        params
      };

      return options.createLocation ? options.createLocation(params) : defaultLocation;
    },

    importLocation() {
      const options = this.$store.getters[`type-map/optionsFor`](this.resource)?.custom || {};
      const params = {
        product:  this.$store.getters['currentProduct'].name,
        resource: this.resource
      };
      const defaultLocation = {
        name:  'c-cluster-product-resource-create',
        params,
        query: { [MODE]: _IMPORT }
      };

      return options.importLocation ? options.importLocation(params) : defaultLocation;
    },

    canImport() {
      const schema = this.$store.getters['management/schemaFor'](CAPI.RANCHER_CLUSTER);

      return !!schema?.collectionMethods.find((x) => x.toLowerCase() === 'post');
    },

    harvesterEnabled: mapFeature(HARVESTER_FEATURE),

    nonStandardNamespaces() {
      // Show the namespace grouping option if there's clusters with namespaces other than 'fleet-default' or 'fleet-local'
      // This will be used when there's clusters from extension based provisioners
      // We should re-visit this for scaling reasons
      return this.filteredRows.some((c) => c.metadata.namespace !== 'fleet-local' && c.metadata.namespace !== 'fleet-default');
    },

    tokenExpiredData() {
      const counts = this.rows.reduce((res, provCluster) => {
        const expireData = provCluster.cloudCredential?.expireData;

        if (expireData?.expiring) {
          res.expiring++;
        }
        if (expireData?.expired) {
          res.expired++;
        }

        return res;
      }, {
        expiring: 0,
        expired:  0
      });

      return {
        expiring: counts.expiring ? this.t('cluster.cloudCredentials.banners.expiring', { count: counts.expiring }) : '',
        expired:  counts.expired ? this.t('cluster.cloudCredentials.banners.expired', { count: counts.expired }) : '',
      };
    }
  },

  $loadingResources() {
    // results are filtered so we wouldn't get the correct count on indicator...
    return { loadIndeterminate: true };
  }

};
</script>

<template>
  <div>
    <Banner
      v-if="showRke1DeprecationWarning"
      color="warning"
      label-key="cluster.banner.rke1DeprecationMessage"
    />

    <Banner
      v-if="hiddenHarvesterCount"
      color="info"
      :label="t('cluster.harvester.clusterWarning', {count: hiddenHarvesterCount} )"
    />

    <Masthead
      :schema="schema"
      :resource="resource"
      :create-location="createLocation"
      component-testid="cluster-manager-list"
      :show-incremental-loading-indicator="incrementalLoadingIndicator"
      :load-resources="loadResources"
      :load-indeterminate="loadIndeterminate"
    >
      <template
        v-if="canImport"
        #extraActions
      >
        <router-link
          :to="importLocation"
          class="btn role-primary mr-10"
          data-testid="cluster-manager-list-import"
        >
          {{ t('cluster.importAction') }}
        </router-link>
      </template>
    </Masthead>

    <Banner
      v-if="tokenExpiredData.expiring"
      color="warning"
      :label="tokenExpiredData.expiring"
    />
    <Banner
      v-if="tokenExpiredData.expired"
      color="error"
      :label="tokenExpiredData.expired"
    />

    <ResourceTable
      :schema="schema"
      :rows="filteredRows"
      :namespaced="nonStandardNamespaces"
      :loading="loading"
      :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
      :data-testid="'cluster-list'"
      :force-update-live-and-delayed="forceUpdateLiveAndDelayed"
      :sub-rows="true"
    >
      <!-- Why are state column and subrow overwritten here? -->
      <!-- for rke1 clusters, where they try to use the mgmt cluster stateObj instead of prov cluster stateObj,  -->
      <!-- updates were getting lost. This isn't performant as normal columns, but the list shouldn't grow -->
      <!-- big enough for the performance to matter -->
      <template #cell:state="{row}">
        <BadgeState
          :color="row.stateBackground"
          :label="row.stateDisplay"
        />
      </template>
      <template #sub-row="{fullColspan, row, keyField, componentTestid, i, onRowMouseEnter, onRowMouseLeave}">
        <tr
          :key="row[keyField] + '-description'"
          :data-testid="componentTestid + '-' + i + '-row-description'"
          class="state-description sub-row"
          @mouseenter="onRowMouseEnter"
          @mouseleave="onRowMouseLeave"
        >
          <td v-if="row.cloudCredentialWarning || row.stateDescription">
&nbsp;
          </td>
          <td
            v-if="row.cloudCredentialWarning || row.stateDescription"
            :colspan="fullColspan - 1"
          >
            <CloudCredExpired
              v-if="row.cloudCredentialWarning"
              :value="row.cloudCredential.expires"
              :row="row.cloudCredential"
              :verbose="true"
              :class="{'mb-10': row.stateDescription}"
            />
            <div
              v-if="row.stateDescription"
              :class="{ 'text-error' : row.stateObj.error }"
            >
              {{ row.stateDescription }}
            </div>
          </td>
        </tr>
      </template>
      <template #cell:summary="{row}">
        <span v-if="!row.stateParts.length">{{ row.nodes.length }}</span>
      </template>
      <template #col:kubernetesVersion="{row}">
        <td class="col-name">
          <span>
            {{ row.kubernetesVersion }}
          </span>
          <div
            v-clean-tooltip="{content: row.architecture.tooltip, placement: 'left'}"
            class="text-muted"
          >
            {{ row.architecture.label }}
          </div>
        </td>
      </template>
      <template #cell:explorer="{row}">
        <router-link
          v-if="row.mgmt && row.mgmt.isReady && !row.hasError"
          data-testid="cluster-manager-list-explore-management"
          class="btn btn-sm role-secondary"
          :to="{name: 'c-cluster', params: {cluster: row.mgmt.id}}"
        >
          {{ t('cluster.explore') }}
        </router-link>
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
