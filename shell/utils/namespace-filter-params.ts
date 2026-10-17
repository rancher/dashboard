import type { Store } from 'vuex';
import { NAMESPACE } from '@shell/config/types';
import { ALL_NAMESPACES } from '@shell/store/prefs';
import stevePaginationUtils from '@shell/plugins/steve/steve-pagination-utils';

/**
 * The project/namespace filter params (from the header's namespace filter)
 * that scope steve list requests to the namespaces the user selected.
 */
export function getNamespaceFilterParams(store: Store<any>) {
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
