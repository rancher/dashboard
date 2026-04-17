import MgmtCluster from '@shell/models/management.cattle.io.cluster';
import { filterHiddenLocalCluster, filterOnlyKubernetesClusters, paginationFilterClusters } from '@shell/utils/cluster';
import { VuexStore } from '@shell/types/store/vuex';
import {
  FilterArgs, PaginationArgs, PaginationFilterEquality, PaginationFilterField, PaginationParamFilter
} from '@shell/types/store/pagination.types';
import { sameContents } from '@shell/utils/array';
import { PagTableFetchPageSecondaryResourcesOpts, PagTableFetchSecondaryResourcesOpts, PagTableFetchSecondaryResourcesReturns } from '@shell/types/components/paginatedResourceTable';
import { CAPI, MANAGEMENT } from '@shell/config/types';
import { ActionFindPageArgs } from '@shell/types/store/dashboard-store.types';

interface CommonConfig {
  $store: VuexStore
}

/**
 * Utils to support listing management.cattle.io.clusters
 */
class ManagementClusterUtils {
  /**
     * Filter out hidden clusters from list of all clusters
     */
  filterRowsLocal(rows: MgmtCluster[], { $store }: CommonConfig) {
    return filterHiddenLocalCluster(filterOnlyKubernetesClusters(rows || [], $store), $store);
  }

  /**
   * Filter out hidden clusters via api
   */
  filterRowsApi(pagination: PaginationArgs, { $store }: CommonConfig): PaginationArgs {
    if (!pagination.filters) {
      pagination.filters = [];
    }

    const existingFilters = pagination.filters;
    const requiredFilters = paginationFilterClusters($store, false);

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
  }

  /**
   * Fetch resources used to support vai off world
   *
   * Of type PagTableFetchSecondaryResources
   */
  fetchSecondaryResources(opts: PagTableFetchSecondaryResourcesOpts, { $store }: CommonConfig): Promise<any>[] {
    if (opts.canPaginate) {
      return [];
    }

    const promises = [];

    if ( $store.getters['management/canList'](CAPI.RANCHER_CLUSTER) ) {
      promises.push($store.dispatch('management/findAll', { type: CAPI.RANCHER_CLUSTER }));
    }

    if ( $store.getters['management/canList'](CAPI.MACHINE) ) {
      $store.dispatch('management/findAll', { type: CAPI.MACHINE });
    }

    if ( $store.getters['management/canList'](MANAGEMENT.NODE) ) {
      $store.dispatch('management/findAll', { type: MANAGEMENT.NODE });
    }

    // We need to fetch node pools and node templates in order to correctly show the provider for RKE1 clusters
    if ( $store.getters['management/canList'](MANAGEMENT.NODE_POOL) ) {
      $store.dispatch('management/findAll', { type: MANAGEMENT.NODE_POOL });
    }

    if ( $store.getters['management/canList'](MANAGEMENT.NODE_TEMPLATE) ) {
      $store.dispatch('management/findAll', { type: MANAGEMENT.NODE_TEMPLATE });
    }

    return promises;
  }

  /**
   * Fetch resources used to support vai on and the current page
   */
  async fetchPageSecondaryResources({
    canPaginate, force, page, pagResult
  }: PagTableFetchPageSecondaryResourcesOpts, { $store }: CommonConfig): Promise<Promise<any>[]> {
    if (!canPaginate || !page?.length) {
      return [];
    }

    const promises = [];

    if ( $store.getters['management/canList'](CAPI.RANCHER_CLUSTER) ) {
      const opt: ActionFindPageArgs = {
        force,
        pagination: new FilterArgs({
          filters: new PaginationParamFilter({
            fields: [{
              value:    page.map((r: any) => r.provClusterId).join(','),
              equality: PaginationFilterEquality.IN,
              field:    'id',
            }],
          })
        })
      };

      // Prov clusters
      promises.push($store.dispatch(`management/findPage`, { type: CAPI.RANCHER_CLUSTER, opt }));
    }

    if ( $store.getters['management/canList'](CAPI.MACHINE) ) {
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

      promises.push($store.dispatch(`management/findPage`, { type: CAPI.MACHINE, opt }));
    }

    if ( $store.getters['management/canList'](MANAGEMENT.NODE) ) {
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

      $store.dispatch(`management/findPage`, { type: MANAGEMENT.NODE, opt });
    }

    // TODO: RC confirm with hosted providers, if not needed remove
    // We need to fetch node pools and node templates in order to correctly show the provider for RKE1 clusters
    // if ( $store.getters['management/canList'](MANAGEMENT.NODE_POOL) && $store.getters['management/canList'](MANAGEMENT.NODE_TEMPLATE)) {
    //   const nodePoolFilters = PaginationParamFilter.createMultipleFields(page
    //     .filter((p: any) => p.id)
    //     .map((r: any) => new PaginationFilterField({
    //       field: 'spec.clusterName',
    //       value: r.id
    //     })));

    //   const nodePools = await $store.dispatch(`management/findPage`, {
    //     type: MANAGEMENT.NODE_POOL,
    //     opt:  {
    //       force,
    //       pagination: new FilterArgs({ filters: nodePoolFilters })
    //     }
    //   });

    //   const templateOpt = PaginationParamFilter.createMultipleFields(nodePools
    //     .filter((np: any) => !!np.nodeTemplateId)
    //     .map((np: any) => new PaginationFilterField({
    //       field: 'id',
    //       value: np.nodeTemplateId,
    //       exact: true,
    //     })));

    //   $store.dispatch(`management/findPage`, {
    //     type: MANAGEMENT.NODE_TEMPLATE,
    //     opt:  {
    //       force,
    //       pagination: new FilterArgs({ filters: templateOpt })
    //     }
    //   });
    // }

    return promises;
  }

  forgetSecondaryResources({ $store }: CommonConfig) {
    $store.dispatch('management/forgetType', CAPI.RANCHER_CLUSTER);
    $store.dispatch('management/forgetType', CAPI.MACHINE);
    $store.dispatch('management/forgetType', MANAGEMENT.NODE);
    $store.dispatch('management/forgetType', MANAGEMENT.NODE_POOL);
    $store.dispatch('management/forgetType', MANAGEMENT.NODE_TEMPLATE);
  }
}

const instance = new ManagementClusterUtils();

export default instance;
