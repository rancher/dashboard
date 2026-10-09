import {
  ref, toValue, watch, type MaybeRefOrGetter, type Ref
} from 'vue';
import { useStore } from 'vuex';
import { NAMESPACE } from '@shell/config/types';
import { ALL_NAMESPACES } from '@shell/store/prefs';
import stevePaginationUtils from '@shell/plugins/steve/steve-pagination-utils';

/**
 * The steve query params (e.g. `filter=...&projectsornamespaces=...`) that apply the current namespace
 * filter to a list request. Empty when nothing needs filtering. Updated when the namespace filter or
 * the types change.
 *
 * @param types namespaced types the params will be used with. The first one with a schema is used to
 * build the params, the structure is the same across types
 */
export function useNamespaceFilterParam(types: MaybeRefOrGetter<string[]>): Ref<string> {
  const store = useStore();
  const param = ref('');

  function build(): string {
    const { projectsOrNamespaces, filters } = stevePaginationUtils.createParamsFromNsFilter({
      allNamespaces:                 store.getters['cluster/all'](NAMESPACE),
      selection:                     store.getters['namespaceFilters'],
      isAllNamespaces:               store.getters['isAllNamespaces'],
      isLocalCluster:                store.getters['currentCluster']?.isLocal,
      showReservedRancherNamespaces: store.getters['prefs/get'](ALL_NAMESPACES),
      productHidesSystemNamespaces:  store.getters['currentProduct']?.hideSystemResources,
    });

    const schema = toValue(types)
      .map((type) => store.getters['cluster/schemaFor'](type))
      .find((s) => !!s);

    const path = stevePaginationUtils.createParamsForPagination({
      schema,
      opt: {
        pagination: {
          filters,
          projectsOrNamespaces,
          page: 1,
          sort: [],
        }
      }
    }) || '';

    return path.replace(/page=\d+&?/g, '').replace(/pagesize=\d+&?/g, '').replace(/&$/, '');
  }

  watch([() => store.getters['namespaceFilters'], () => toValue(types)], () => {
    param.value = build();
  }, { immediate: true });

  return param;
}
