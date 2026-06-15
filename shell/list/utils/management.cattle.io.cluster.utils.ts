import MgmtCluster from '@shell/models/management.cattle.io.cluster';
import { filterHiddenLocalCluster, filterOnlyKubernetesClusters, paginationFilterClusters } from '@shell/utils/cluster';
import { VuexStore } from '@shell/types/store/vuex';
import { FilterArgs, PaginationArgs, PaginationFilterEquality, PaginationParamFilter } from '@shell/types/store/pagination.types';
import { sameContents } from '@shell/utils/array';
import { PagTableFetchPageSecondaryResourcesOpts, PagTableFetchSecondaryResourcesOpts } from '@shell/types/components/paginatedResourceTable';
import { CAPI } from '@shell/config/types';
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
  filterRowsLocal(rows: MgmtCluster[], { $store }: CommonConfig): MgmtCluster[] {
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

    return promises;
  }

  forgetSecondaryResources({ context }: { context?: string } = {}, { $store }: CommonConfig) {
    const canList = $store.getters['management/canList'](CAPI.RANCHER_CLUSTER);
    const canPaginate = $store.getters['management/paginationEnabled']({
      id: CAPI.RANCHER_CLUSTER,
      context
    });

    if (canList && canPaginate) {
      $store.dispatch('management/forgetType', CAPI.RANCHER_CLUSTER);
    }
  }
}

const instance = new ManagementClusterUtils();

export default instance;
