import { ref } from 'vue';
import { useStore } from 'vuex';
import { useRouter, type RouteLocationRaw } from 'vue-router';
import debounce from 'lodash/debounce';
import { useI18n } from '@shell/composables/useI18n';
import { PaginationParamFilter } from '@shell/types/store/pagination.types';
import { WORKLOAD_RESOURCE_TYPES } from '../types';
import {
  WORKLOAD_SEARCH_DEBOUNCE_MS,
  WORKLOAD_SEARCH_RESULTS_PER_TYPE,
  type WorkloadSearchOption,
} from './types';

interface WorkloadSearchResource {
  metadata?: { name?: string; namespace?: string };
  detailLocation?: RouteLocationRaw;
}

export function useWorkloadSearch() {
  const store = useStore();
  const router = useRouter();
  const { t } = useI18n(store);

  const searchTerm = ref('');
  const loading = ref(false);
  const options = ref<WorkloadSearchOption[]>([]);

  // Guards against a slower, earlier search response overwriting a later one.
  let requestId = 0;

  async function fetchOptionsForType(type: string, term: string): Promise<WorkloadSearchOption[]> {
    if (!store.getters['cluster/schemaFor'](type) || !store.getters['cluster/canList'](type)) {
      return [];
    }

    try {
      const res = await store.dispatch('cluster/findPage', {
        type,
        opt: {
          pagination: {
            page:     1,
            pageSize: WORKLOAD_SEARCH_RESULTS_PER_TYPE,
            sort:     [{ field: 'metadata.name', asc: true }],
            filters:  [PaginationParamFilter.createSingleField({ field: 'metadata.name', value: term, exact: false })],
          },
          transient: true,
          watch:     false,
        },
      });

      const data: WorkloadSearchResource[] = res?.data || [];

      if (!data.length) {
        return [];
      }

      const label = t(`typeLabel."${ type }"`, { count: 2 })?.trim() || type;

      return [
        { kind: 'group', label, uniqueId: `group-${ type }` },
        ...data.map((resource) => ({
          label:     resource.metadata?.name || '',
          namespace: resource.metadata?.namespace,
          uniqueId:  `${ type }/${ resource.metadata?.namespace }/${ resource.metadata?.name }`,
          value:     resource.detailLocation,
        })),
      ];
    } catch {
      return [];
    }
  }

  async function performSearch(term: string): Promise<void> {
    const currentRequestId = ++requestId;

    loading.value = true;

    try {
      const results = await Promise.all(WORKLOAD_RESOURCE_TYPES.map((type) => fetchOptionsForType(type, term)));

      if (currentRequestId !== requestId) {
        return;
      }

      options.value = results.flat();
    } finally {
      if (currentRequestId === requestId) {
        loading.value = false;
      }
    }
  }

  const debouncedSearch = debounce(performSearch, WORKLOAD_SEARCH_DEBOUNCE_MS);

  function onSearch(term: string): void {
    searchTerm.value = term;

    if (!term) {
      debouncedSearch.cancel();
      requestId++;
      options.value = [];
      loading.value = false;

      return;
    }

    debouncedSearch(term);
  }

  function onSelect(route?: RouteLocationRaw): void {
    if (route) {
      router.push(route);
    }
  }

  return {
    searchTerm,
    loading,
    options,
    onSearch,
    onSelect,
  };
}
