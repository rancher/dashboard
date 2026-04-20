<script  lang="ts">
import { Banner } from '@components/Banner';
import Masthead from '@shell/components/ResourceList/Masthead.vue';
import { CAPI, COUNT, MANAGEMENT } from '@shell/config/types';
import { MODE, _IMPORT } from '@shell/config/query-params';
import { mapFeature, HARVESTER as HARVESTER_FEATURE } from '@shell/store/features';
import { NAME as EXPLORER } from '@shell/config/product/explorer';
import { NAME as MANAGER } from '@shell/config/product/manager';
import { isAutoscalerFeatureFlagEnabled } from '@shell/utils/autoscaler-utils';
import { AUTOSCALER_ENABLED } from '@shell/config/table-headers';
import PaginatedResourceTable from '@shell/components/PaginatedResourceTable.vue';
import { PagTableFetchPageSecondaryResourcesOpts, PagTableFetchSecondaryResourcesOpts, PagTableFetchSecondaryResourcesReturns } from '@shell/types/components/paginatedResourceTable';
import { FilterArgs, PaginationArgs, PaginationFilterField, PaginationParamFilter } from '@shell/types/store/pagination.types';
import { ActionFindPageArgs } from '@shell/types/store/dashboard-store.types';
import MachineSummaryGraph from '@shell/components/formatter/MachineSummaryGraph.vue';
import MgmtCluster from '@shell/models/management.cattle.io.cluster';
import ManagementClusterUtils from '@/shell/list/utils/management.cattle.io.cluster.utils';
import { STEVE_AUTOSCALER_ENABLED } from '@shell/config/pagination-table-headers';
import myLogger from '@shell/utils/my-logger';

export default {
  components: {
    Banner, PaginatedResourceTable, Masthead, MachineSummaryGraph
  },

  data() {
    const mgmtClusterSchema = this.$store.getters['management/schemaFor'](MANAGEMENT.CLUSTER);
    const headers = this.$store.getters['type-map/headersFor'](mgmtClusterSchema, false);
    const paginationHeaders = this.$store.getters['type-map/headersFor'](mgmtClusterSchema, true);

    if (isAutoscalerFeatureFlagEnabled(this.$store)) {
      headers.splice(-3, 0, AUTOSCALER_ENABLED);
      paginationHeaders.splice(-3, 0, STEVE_AUTOSCALER_ENABLED);
    }

    return {
      headers,
      paginationHeaders,

      clusterCount: 0,

      mgmtClusterSchema,
      provClusterSchema: this.$store.getters['management/schemaFor'](CAPI.RANCHER_CLUSTER),
    };
  },

  // Forget the types when we leave the page
  beforeUnmount() {
    ManagementClusterUtils.forgetSecondaryResources({ $store: this.$store });
  },

  methods: {
    filterRowsLocal(rows: MgmtCluster[]) {
      return ManagementClusterUtils.filterRowsLocal(rows, { $store: this.$store });
    },

    filterRowsApi(pagination: PaginationArgs): PaginationArgs {
      return ManagementClusterUtils.filterRowsApi(pagination, { $store: this.$store });
    },

    fetchSecondaryResources(opts: PagTableFetchSecondaryResourcesOpts): PagTableFetchSecondaryResourcesReturns {
      if (opts.canPaginate) {
        return Promise.resolve();
      }

      const promises = ManagementClusterUtils.fetchSecondaryResources(opts, { $store: this.$store });

      // Additional requests required to support columns in this view (e.g. machines)

      if ( this.$store.getters['management/canList'](CAPI.MACHINE_DEPLOYMENT)) {
        this.$store.dispatch(`management/findAll`, { type: CAPI.MACHINE_DEPLOYMENT });
      }

      if ( this.$store.getters['management/canList'](MANAGEMENT.NODE_POOL)) {
        this.$store.dispatch(`management/findAll`, { type: MANAGEMENT.NODE_POOL });
      }

      return Promise.all(promises);
    },

    async fetchPageSecondaryResources({
      canPaginate, force, page, pagResult
    }: PagTableFetchPageSecondaryResourcesOpts) {
      this.clusterCount = !canPaginate || !page?.length ? 0 : pagResult.count;

      if (!canPaginate || !page?.length) {
        return;
      }

      const promises = await ManagementClusterUtils.fetchPageSecondaryResources({
        canPaginate, force, page, pagResult
      }, { $store: this.$store });

      // Additional requests required to support columns in this view (e.g. machines)

      if ( this.$store.getters['management/canList'](CAPI.MACHINE_DEPLOYMENT)) {
        const opt: ActionFindPageArgs = {
          force,
          pagination: {
            page:                 1,
            pageSize:             100000,
            filters:              [],
            sort:                 [],
            projectsOrNamespaces: []
          }
          // TODO: RC add back once https://github.com/rancher/rancher/issues/54656 resolved (index on spec.clusterName)
          // pagination: new FilterArgs({
          //   filters: PaginationParamFilter.createMultipleFields(page.map((r: any) => new PaginationFilterField({
          //     field: 'spec.clusterName',
          //     value: r.provClusterName
          //   }))),
          // })
        };

        this.$store.dispatch(`management/findPage`, { type: CAPI.MACHINE_DEPLOYMENT, opt });
      }

      if ( this.$store.getters['management/canList'](MANAGEMENT.NODE_POOL)) {
        const nodePoolFilters = PaginationParamFilter.createMultipleFields(page
          .filter((p: any) => p.id)
          .map((r: any) => new PaginationFilterField({
            field: 'spec.clusterName',
            value: r.id
          })));

        promises.push(this.$store.dispatch(`management/findPage`, {
          type: MANAGEMENT.NODE_POOL,
          opt:  {
            force,
            pagination: new FilterArgs({ filters: nodePoolFilters })
          }
        }));
      }

      await Promise.all(promises);
    },
  },

  computed: {
    hiddenHarvesterCount() {
      const product = this.$store.getters['currentProduct'];
      const isExplorer = product?.name === EXPLORER;

      // Don't show Harvester banner message on the cluster management page or if Harvester is not enabled
      if (!isExplorer || !this.harvesterEnabled) {
        return 0;
      }

      const allClusters = this.$store.getters['management/count']({ name: CAPI.RANCHER_CLUSTER });
      // clusterCount is total excluding local (if not counted) and harvester (if not counted)
      // at this point though (viewing prov clusters in explorer) we must be in the local cluster, so can exclude that exclusion
      const nonHarvesterClusters = this.clusterCount;

      return allClusters - nonHarvesterClusters;
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
      return !!this.provClusterSchema?.collectionMethods.find((x: string) => x.toLowerCase() === 'post');
    },

    harvesterEnabled: mapFeature(HARVESTER_FEATURE),

    nonStandardNamespaces() {
      // Show the namespace grouping option if there's clusters with namespaces other than 'fleet-default' or 'fleet-local'
      // This will be used when there's clusters from extension based provisioners

      const counts = this.$store.getters['management/all'](COUNT)?.[0]?.counts || {};
      const namespaces: { [nsName: string]: { count: number } } = counts[CAPI.RANCHER_CLUSTER]?.namespaces || counts.namespaces || {};

      for (const ns in namespaces) {
        if (ns !== 'fleet-local' && ns !== 'fleet-default' && namespaces[ns].count > 0) {
          return true;
        }
      }

      return false;
    },

  },

};
</script>

<template>
  <div>
    <Banner
      v-if="hiddenHarvesterCount"
      color="info"
      :label="t('cluster.harvester.clusterWarning', {count: hiddenHarvesterCount} )"
    />

    <Masthead
      :schema="provClusterSchema"
      :resource="provClusterSchema.id"
      :create-location="createLocation"
      component-testid="cluster-manager-list"
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

    <PaginatedResourceTable
      :schema="mgmtClusterSchema"

      :headers="headers"
      :pagination-headers="paginationHeaders"
      context="home"

      :local-filter="filterRowsLocal"
      :api-filter="filterRowsApi"

      :fetch-secondary-resources="fetchSecondaryResources"
      :fetch-page-secondary-resources="fetchPageSecondaryResources"

      :namespaced="nonStandardNamespaces"
    >
      <template #cell:summary="{row}">
        <!-- Replace the MACHINE_SUMMARY columns contents... but only if there's no stateParts -->
        <span v-if="!row.stateParts.length">{{ row.status.info.nodeCount || 0 }}</span>
        <MachineSummaryGraph
          v-else
          :row="row"
        />
      </template>
      <template #cell:explorer="{row}">
        <!-- Align side nav cluster, home page name link and cluster management cluster explor buttons on canExplore -->
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
  </div>
</template>
