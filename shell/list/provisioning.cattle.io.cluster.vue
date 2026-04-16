<script  lang="ts">
import { Banner } from '@components/Banner';
import Masthead from '@shell/components/ResourceList/Masthead.vue';
import { CAPI, MANAGEMENT } from '@shell/config/types';
import { MODE, _IMPORT } from '@shell/config/query-params';
import { mapFeature, HARVESTER as HARVESTER_FEATURE } from '@shell/store/features';
import { NAME as EXPLORER } from '@shell/config/product/explorer';
import { isAutoscalerFeatureFlagEnabled } from '@shell/utils/autoscaler-utils';
import { AUTOSCALER_ENABLED } from '@shell/config/table-headers';
import PaginatedResourceTable from '@shell/components/PaginatedResourceTable.vue';
import { PagTableFetchPageSecondaryResourcesOpts, PagTableFetchSecondaryResourcesOpts, PagTableFetchSecondaryResourcesReturns } from '@shell/types/components/paginatedResourceTable';
import { PaginationArgs } from '@shell/types/store/pagination.types';
import { ActionFindPageArgs } from '@shell/types/store/dashboard-store.types';
import MachineSummaryGraph from '@shell/components/formatter/MachineSummaryGraph.vue';
import MgmtCluster from '@shell/models/management.cattle.io.cluster';
import ManagementClusterUtils from '@/shell/list/utils/management.cattle.io.cluster.utils';

export default {
  components: {
    Banner, PaginatedResourceTable, Masthead, MachineSummaryGraph
  },

  data() {
    return {
      mgmtClusterSchema: this.$store.getters['management/schemaFor'](MANAGEMENT.CLUSTER),
      provClusterSchema: this.$store.getters['management/schemaFor'](CAPI.RANCHER_CLUSTER),

    };
  },

  methods: {
    filterRowsLocal(rows: MgmtCluster[]) {
      return ManagementClusterUtils.filterRowsLocal(rows, { $store: this.$store });
    },

    filterRowsApi(pagination: PaginationArgs): PaginationArgs {
      return ManagementClusterUtils.filterRowsApi(pagination, { $store: this.$store });
    },

    fetchSecondaryResources(opts: PagTableFetchSecondaryResourcesOpts): PagTableFetchSecondaryResourcesReturns {
      const promises = ManagementClusterUtils.fetchSecondaryResources(opts, { $store: this.$store });

      if ( this.$store.getters['management/canList'](CAPI.MACHINE_DEPLOYMENT)) {
        this.$store.dispatch(`management/findAll`, { type: CAPI.MACHINE_DEPLOYMENT }); // TODO: RC cross check with old fetch
      }

      return Promise.all(promises);
    },

    async fetchPageSecondaryResources({
      canPaginate, force, page, pagResult
    }: PagTableFetchPageSecondaryResourcesOpts) {
      const promises = await ManagementClusterUtils.fetchPageSecondaryResources({
        canPaginate, force, page, pagResult
      }, { $store: this.$store });

      if ( this.$store.getters['management/canList'](CAPI.MACHINE_DEPLOYMENT)) {
        const opt: ActionFindPageArgs = {
          force,
          pagination: { // TODO: RC Temp code, see below
            page:                 1,
            pageSize:             100000,
            filters:              [],
            sort:                 [],
            projectsOrNamespaces: []
          }
          // TODO: RC cluster.x-k8s.io.machinedeployment required index on spec.clusterName
          // pagination: new FilterArgs({
          //   filters: PaginationParamFilter.createMultipleFields(page.map((r: any) => new PaginationFilterField({
          //     field: 'spec.clusterName',
          //     value: r.provClusterName
          //   }))),
          // })
        };

        this.$store.dispatch(`management/findPage`, { type: CAPI.MACHINE_DEPLOYMENT, opt });
      }

      // TODO: RC

      await Promise.all(promises);
    },
  },

  computed: {
    hiddenHarvesterCount() {
      const product = this.$store.getters['currentProduct'];
      const isExplorer = product?.name === EXPLORER;

      // Don't show Harvester banner message on the cluster management page or if Harvester if not enabled
      if (!isExplorer || !this.harvesterEnabled) {
        return 0;
      }

      return 0; // TODO: RC low bar ... harvester + local + others = `count`
      // return this.rows.length - filterOnlyKubernetesClusters(this.rows, this.$store).length;
    },

    createLocation() {
      const options = this.$store.getters[`type-map/optionsFor`](CAPI.RANCHER_CLUSTER)?.custom || {};
      const params = {
        product:  this.$store.getters['currentProduct'].name,
        resource: CAPI.RANCHER_CLUSTER
      };
      const defaultLocation = {
        name: 'c-cluster-product-resource-create',
        params
      };

      return options.createLocation ? options.createLocation(params) : defaultLocation;
    },

    importLocation() {
      const options = this.$store.getters[`type-map/optionsFor`](CAPI.RANCHER_CLUSTER)?.custom || {};
      const params = {
        product:  this.$store.getters['currentProduct'].name,
        resource: CAPI.RANCHER_CLUSTER
      };
      const defaultLocation = {
        name:  'c-cluster-product-resource-create',
        params,
        query: { [MODE]: _IMPORT }
      };

      return options.importLocation ? options.importLocation(params) : defaultLocation;
    },

    canImport() {
      // TODO: RC Question Kinara - does PCIC rbac match MCIC, for example schema collectionMethods `post`
      return !!this.mgmtClusterSchema?.collectionMethods.find((x: string) => {
        const verb = x.toLowerCase();

        return verb === 'post' || verb === 'blocked-post';
      });
    },

    harvesterEnabled: mapFeature(HARVESTER_FEATURE),

    nonStandardNamespaces() {
      // Show the namespace grouping option if there's clusters with namespaces other than 'fleet-default' or 'fleet-local'
      // This will be used when there's clusters from extension based provisioners
      // We should re-visit this for scaling reasons
      // TODO: RC count be done via counts and the spread of ns's in there for prov cluster
      return 0;
      // return this.filteredRows.some((c) => c.metadata.namespace !== 'fleet-local' && c.metadata.namespace !== 'fleet-default');
    },

    headers() { // TODO: RC put in data
      const headers = this.$store.getters['type-map/headersFor'](this.mgmtClusterSchema, false);

      if (isAutoscalerFeatureFlagEnabled(this.$store)) {
        headers.splice(-3, 0, AUTOSCALER_ENABLED); // TODO: RC columns receives mgmt cluster now
      }

      return headers;
    },

    paginationHeaders() {
      const headers = this.$store.getters['type-map/headersFor'](this.mgmtClusterSchema, true);

      if (isAutoscalerFeatureFlagEnabled(this.$store)) {
        headers.splice(-3, 0, AUTOSCALER_ENABLED); // TODO: RC columns receives mgmt cluster now
      }

      return headers;
    }

  },

};
</script>

<template>
  <div>
    <!-- <Banner
      v-if="showRke1DeprecationWarning"
      color="warning"
      label-key="cluster.banner.rke1DeprecationMessage"
    /> -->

    <Banner
      v-if="hiddenHarvesterCount"
      color="info"
      :label="t('cluster.harvester.clusterWarning', {count: hiddenHarvesterCount} )"
    />

    <!-- // TODO: RC test multiple pages / on page change get second page's data -->
    <!-- // TODO: RC test updates over socket -->
    <!-- // TODO: RC test CRUD of imported, rke2 clusters -->

    <Masthead
      :schema="provClusterSchema"
      :resource="provClusterSchema.id"
      :create-location="createLocation"
      component-testid="cluster-manager-list"
    >
      <!-- :show-incremental-loading-indicator="incrementalLoadingIndicator"
      :load-resources="loadResources"
      :load-indeterminate="loadIndeterminate" -->
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

    <!--
      :table-actions="false"
      :row-actions="false"
      key-field="id"
      :groupable="false"
      -->
    <PaginatedResourceTable
      :schema="mgmtClusterSchema"

      :headers="headers"
      :pagination-headers="paginationHeaders"
      context="home"

      :local-filter="filterRowsLocal"
      :api-filter="filterRowsApi"

      :fetch-secondary-resources="fetchSecondaryResources"
      :fetch-page-secondary-resources="fetchPageSecondaryResources"

      :namespaced="nonStandardNamespaces > 0"
    >
      <template #cell:summary="{row}">
        <!-- Replace the MACHINE_SUMMARY columns contents... but only if there's no stateParts -->
        <!-- Not sure how the conditional replace works... c&p from home -->
        <span v-if="!row.stateParts.length">{{ row.nodes.length }}</span>
        <MachineSummaryGraph
          v-else
          :row="row"
        />
      </template>
      <template #col:kubernetesVersion="{row}">
        <!--  TODO: RC code duplication -->
        <td class="col-name">
          <span>
            {{ row.kubernetesVersion }}
          </span>
          <div
            v-clean-tooltip="{content: row.architecture?.tooltip, placement: 'left'}"
            class="text-muted"
          >
            {{ row.architecture && row.architecture.label ? row.architecture.label : 'ffs2' }}
          </div>
        </td>
      </template>
      <template #cell:explorer="{row}">
        <router-link
          v-if="row.canExplore"
          data-testid="cluster-manager-list-explore-management"
          class="btn btn-sm role-secondary"
          :to="{name: 'c-cluster', params: {cluster: row.id}}"
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
    </PaginatedResourceTable>
    <!-- :sub-rows="true" TODO: RC wut -->
    <!-- <ResourceTable
      :headers="headers"
      :table-actions="true"
      :rows="filteredRows"
      :namespaced="nonStandardNamespaces"
      :loading="loading"
      :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
      :data-testid="'cluster-list'"
      :force-update-live-and-delayed="forceUpdateLiveAndDelayed"
      :sub-rows="true"
    >-->
    <!-- Why are state column and subrow overwritten here? -->
    <!-- for rke1 clusters, where they try to use the mgmt cluster stateObj instead of prov cluster stateObj,  -->
    <!-- updates were getting lost. This isn't performant as normal columns, but the list shouldn't grow -->
    <!-- big enough for the performance to matter -->
    <!--<template #cell:state="{row}">
        <BadgeState
          :color="row.stateBackground"
          :label="row.stateDisplay"
        />
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
            v-clean-tooltip="{content: row.architecture?.tooltip, placement: 'left'}"
            class="text-muted"
          >
            {{ row.architecture && row.architecture.label ? row.architecture.label : 'ffs2' }}
          </div>
        </td>
      </template>
      <template #cell:explorer="{row}">
        <router-link
          v-if="row.canExplore"
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
    </ResourceTable> -->
  </div>
</template>
