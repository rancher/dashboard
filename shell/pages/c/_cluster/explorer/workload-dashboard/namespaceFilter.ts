import type { Store } from 'vuex';
import { NAMESPACE } from '@shell/config/types';
import { ALL_NAMESPACES } from '@shell/store/prefs';
import stevePaginationUtils from '@shell/plugins/steve/steve-pagination-utils';

/**
 * The project/namespace filter params (from the header's namespace filter)
 * that scope the workload dashboard's own "by X" section requests. Shared
 * with the search feature so search results are scoped the same way.
 */
export function getWorkloadNamespaceFilterParams(store: Store<any>) {
  const selection: string[] = store.getters['namespaceFilters'];

  return stevePaginationUtils.createParamsFromNsFilter({
    allNamespaces:                 store.getters['cluster/all'](NAMESPACE),
    selection,
    isAllNamespaces:               store.getters['isAllNamespaces'],
    isLocalCluster:                store.getters['currentCluster']?.isLocal,
    showReservedRancherNamespaces: store.getters['prefs/get'](ALL_NAMESPACES),
    productHidesSystemNamespaces:  store.getters['currentProduct']?.hideSystemResources,
  });
}
