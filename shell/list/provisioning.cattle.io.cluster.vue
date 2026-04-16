<script  lang="ts">
import { Banner } from '@components/Banner';
import ResourceTable from '@shell/components/ResourceTable.vue';
import Masthead from '@shell/components/ResourceList/Masthead.vue';
import { allHash } from '@shell/utils/promise';
import { CAPI, MANAGEMENT, SNAPSHOT, NORMAN } from '@shell/config/types';
import { MODE, _IMPORT } from '@shell/config/query-params';
import { filterOnlyKubernetesClusters, filterHiddenLocalCluster, paginationFilterClusters } from '@shell/utils/cluster';
import { mapFeature, HARVESTER as HARVESTER_FEATURE } from '@shell/store/features';
import { NAME as EXPLORER } from '@shell/config/product/explorer';
import ResourceFetch from '@shell/mixins/resource-fetch';
import { BadgeState } from '@components/BadgeState';
import { isAutoscalerFeatureFlagEnabled } from '@shell/utils/autoscaler-utils';
import { AUTOSCALER_ENABLED } from '@shell/config/table-headers';
import PaginatedResourceTable from '@shell/components/PaginatedResourceTable.vue';
import { PagTableFetchPageSecondaryResourcesOpts, PagTableFetchSecondaryResourcesOpts, PagTableFetchSecondaryResourcesReturns } from '@shell/types/components/paginatedResourceTable';
import { FilterArgs, PaginationArgs, PaginationFilterField, PaginationParamFilter } from '@shell/types/store/pagination.types';
import { sameContents } from '@shell/utils/array';
import { promises } from 'node:dns';
import { ActionFindPageArgs } from '@shell/types/store/dashboard-store.types';
import MachineSummaryGraph from '@shell/components/formatter/MachineSummaryGraph.vue';

export default {
  components: {
    Banner, PaginatedResourceTable, Masthead, MachineSummaryGraph
  },
  // mixins: [ResourceFetch],
  // props:  {
  //   loadIndeterminate: {
  //     type:    Boolean,
  //     default: false
  //   },

  //   incrementalLoadingIndicator: {
  //     type:    Boolean,
  //     default: false
  //   },

  //   useQueryParamsForSimpleFiltering: {
  //     type:    Boolean,
  //     default: false
  //   }
  // },

  async fetch() {
    // this.$initializeFetchData(CAPI.RANCHER_CLUSTER);
    // const hash = {
    //   rancherClusters: this.$fetchType(CAPI.RANCHER_CLUSTER), Yes
    //   normanClusters:  this.$fetchType(NORMAN.CLUSTER, [], 'rancher'), No
    //   mgmtClusters:    this.$fetchType(MANAGEMENT.CLUSTER), Yes
    // };

    // if ( this.$store.getters['management/canList'](SNAPSHOT) ) {
    //   hash.etcdSnapshots = this.$fetchType(SNAPSHOT); No
    // }

    // if ( this.$store.getters['management/canList'](CAPI.MACHINE) ) {
    //   hash.capiMachines = this.$fetchType(CAPI.MACHINE);
    // }

    // if ( this.$store.getters['management/canList'](MANAGEMENT.NODE) ) {
    //   hash.mgmtNodes = this.$fetchType(MANAGEMENT.NODE);
    // }

    // if ( this.$store.getters['management/canList'](MANAGEMENT.NODE_POOL) ) {
    //   hash.mgmtPools = this.$fetchType(MANAGEMENT.NODE_POOL);
    // }

    // if ( this.$store.getters['management/canList'](MANAGEMENT.NODE_TEMPLATE) ) {
    //   hash.mgmtTemplates = this.$fetchType(MANAGEMENT.NODE_TEMPLATE);
    // }

    // if ( this.$store.getters['management/canList'](CAPI.MACHINE_DEPLOYMENT) ) {
    //   hash.machineDeployments = this.$fetchType(CAPI.MACHINE_DEPLOYMENT); No
    // }

    // // Fetch RKE template revisions so we can show when an updated template is available
    // // This request does not need to be blocking
    // if ( this.$store.getters['management/canList'](MANAGEMENT.RKE_TEMPLATE_REVISION) ) {
    //   this.$fetchType(MANAGEMENT.RKE_TEMPLATE_REVISION); No
    // }

    // const res = await allHash(hash);

    // this.mgmtClusters = res.mgmtClusters;
    // this.showRke1DeprecationWarning = this.rows.some((r) => r.isRke1);
  },

  data() {
    return {
      // schema:                     this.$store.getters['management/schemaFor'](CAPI.RANCHER_CLUSTER),
      // mgmtClusters:               [], no
      // showRke1DeprecationWarning: false, no
      mgmtClusterSchema: this.$store.getters['management/schemaFor'](MANAGEMENT.CLUSTER),
      provClusterSchema: this.$store.getters['management/schemaFor'](CAPI.RANCHER_CLUSTER),

      canViewProvClusters:  this.$store.getters['management/canList'](CAPI.RANCHER_CLUSTER),
      canViewMachine:       this.$store.getters['management/canList'](CAPI.MACHINE),
      canViewMgmtNodes:     this.$store.getters['management/canList'](MANAGEMENT.NODE),
      canViewMgmtPools:     this.$store.getters['management/canList'](MANAGEMENT.NODE_POOL),
      canViewMgmtTemplates: this.$store.getters['management/canList'](MANAGEMENT.NODE_TEMPLATE),
    };
  },

  methods: {
    /**
     * Filter out hidden clusters from list of all clusters
     */
    filterRowsLocal(rows: any[]) { // TODO: RC common code with home
      return filterHiddenLocalCluster(filterOnlyKubernetesClusters(rows || [], this.$store), this.$store);
    },

    /**
     * Filter out hidden clusters via api
     */
    filterRowsApi(pagination: PaginationArgs): PaginationArgs { // TODO: RC common code with home
      if (!pagination.filters) {
        pagination.filters = [];
      }

      const existingFilters = pagination.filters;
      const requiredFilters = paginationFilterClusters(this.$store, false);

      for (let i = 0; i < requiredFilters.length; i++) {
        let found = false;
        const required = requiredFilters[i];

        for (let j = 0; j < existingFilters.length; j++) {
          const existing = existingFilters[j];

          if (
            required.fields.length === existing.fields.length &&
            sameContents(required.fields.map((e) => e.field), existing.fields.map((e) => e.field))
          ) {
            Object.assign(existing, required);
            found = true;
            break;
          }
        }

        if (!found) {
          pagination.filters.push(required);
        }
      }

      return pagination;
    },

    fetchSecondaryResources(opts: PagTableFetchSecondaryResourcesOpts): PagTableFetchSecondaryResourcesReturns {
      if (opts.canPaginate) {
        return Promise.resolve({});
      }

      const promises = [
        this.$store.dispatch('management/findAll', { type: CAPI.RANCHER_CLUSTER }),
        this.$store.dispatch('rancher/findAll', { type: NORMAN.CLUSTER }),
        this.$store.dispatch('management/findAll', { type: MANAGEMENT.CLUSTER }),
      ];

      if ( this.$store.getters['management/canList'](SNAPSHOT) ) {
        promises.push(this.$store.dispatch('management/findAll', { type: SNAPSHOT }));
      }

      if ( this.$store.getters['management/canList'](CAPI.MACHINE) ) {
        promises.push(this.$store.dispatch('management/findAll', { type: CAPI.MACHINE }));
      }

      if ( this.$store.getters['management/canList'](MANAGEMENT.NODE) ) {
        promises.push(this.$store.dispatch('management/findAll', { type: MANAGEMENT.NODE }));
      }

      if ( this.$store.getters['management/canList'](MANAGEMENT.NODE_POOL) ) {
        promises.push(this.$store.dispatch('management/findAll', { type: MANAGEMENT.NODE_POOL }));
      }

      if ( this.$store.getters['management/canList'](MANAGEMENT.NODE_TEMPLATE) ) {
        promises.push(this.$store.dispatch('management/findAll', { type: MANAGEMENT.NODE_TEMPLATE }));
      }

      if ( this.$store.getters['management/canList'](CAPI.MACHINE_DEPLOYMENT) ) {
        promises.push(this.$store.dispatch('management/findAll', { type: CAPI.MACHINE_DEPLOYMENT }));
      }

      // TODO: RC comment MANAGEMENT.RKE_TEMPLATE_REVISION isn't used anywhere...
      // // Fetch RKE template revisions so we can show when an updated template is available
      // // This request does not need to be blocking
      // if ( this.$store.getters['management/canList'](MANAGEMENT.RKE_TEMPLATE_REVISION) ) {
      //   this.$store.dispatch('management/findAll', { type: MANAGEMENT.RKE_TEMPLATE_REVISION });
      // }

      return Promise.all(promises);
    },

    async fetchPageSecondaryResources({
      canPaginate, force, page, pagResult
    }: PagTableFetchPageSecondaryResourcesOpts) {
      if (!canPaginate || !page?.length) {
        return;
      }

      const promises = [

      ];

      if ( this.canViewProvClusters ) {
        const opt: ActionFindPageArgs = {
          force,
          pagination: new FilterArgs({
            filters: PaginationParamFilter.createMultipleFields(page.map((r: any) => new PaginationFilterField({
              field: 'id',
              value: r.provClusterId
            }))),
          })
        };

        // Prov clusters
        promises.push(this.$store.dispatch(`management/findPage`, { type: CAPI.RANCHER_CLUSTER, opt }));
      }

      if ( this.canViewMachine ) {
        const opt: ActionFindPageArgs = {
          force,
          pagination: { // TODO: RC Temp code, see below
            page:                 1,
            pageSize:             100000,
            filters:              [],
            sort:                 [],
            projectsOrNamespaces: []
          }
          // TODO: RC cluster.x-k8s.io.machines required index on spec.clusterName??
          // pagination: new FilterArgs({
          //   filters: PaginationParamFilter.createMultipleFields(page.map((r: any) => new PaginationFilterField({
          //     field: 'spec.clusterName',
          //     value: r.provClusterName
          //   }))),
          // })
        };

        promises.push(this.$store.dispatch(`management/findPage`, { type: CAPI.MACHINE, opt }));
      }

      if ( this.canViewMgmtNodes ) {
        const opt: ActionFindPageArgs = {
          force,
          pagination: new FilterArgs({
            filters: PaginationParamFilter.createMultipleFields(page.map((r: any) => new PaginationFilterField({
              field: 'id',
              value: r.id,
              exact: false,
            }))),
          })
        };

        this.$store.dispatch(`management/findPage`, { type: MANAGEMENT.NODE, opt });
      }

      // We need to fetch node pools and node templates in order to correctly show the provider for RKE1 clusters
      if ( this.canViewMgmtPools && this.canViewMgmtTemplates) {
        const nodePoolFilters = PaginationParamFilter.createMultipleFields(page
          .filter((p: any) => p.id)
          .map((r: any) => new PaginationFilterField({
            field: 'spec.clusterName',
            value: r.provClusterName // TODO: RC is it?
          })));

        const nodePools = await this.$store.dispatch(`management/findPage`, {
          type: MANAGEMENT.NODE_POOL,
          opt:  {
            force,
            pagination: new FilterArgs({ filters: nodePoolFilters })
          }
        });

        const templateOpt = PaginationParamFilter.createMultipleFields(nodePools
          .filter((np: any) => !!np.nodeTemplateId)
          .map((np: any) => new PaginationFilterField({
            field: 'id',
            value: np.nodeTemplateId,
            exact: true,
          })));

        this.$store.dispatch(`management/findPage`, {
          type: MANAGEMENT.NODE_TEMPLATE,
          opt:  {
            force,
            pagination: new FilterArgs({ filters: templateOpt })
          }
        });
      }

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
    // filteredRows() {
    //   // If Harvester feature is enabled, hide Harvester Clusters
    //   if (this.harvesterEnabled) {
    //     return filterHiddenLocalCluster(filterOnlyKubernetesClusters(this.rows, this.$store), this.$store);
    //   }

    //   // Otherwise, show Harvester clusters - these will be shown with a warning
    //   return filterHiddenLocalCluster(this.rows, this.$store);
    // },

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

    headers() {
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

  // $loadingResources() {
  //   // results are filtered so we wouldn't get the correct count on indicator...
  //   return { loadIndeterminate: true };
  // }

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
