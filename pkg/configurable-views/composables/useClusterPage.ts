import { ref, watch, type Ref } from 'vue';
import { useStore } from 'vuex';
import { fetchClusterPage } from '../templating/widget-data';
import type { PaginationParamFilter } from '@shell/types/store/pagination.types';

export interface ClusterPageQuery {
  resource: string;
  cluster: string;
  perPage: number;
  filters?: PaginationParamFilter[];
  sort?: { field: string; asc: boolean }[];
}

/**
 * One page at a time of a type from one named cluster - the server pages, the table shows it.
 *
 * `load` is what a ResourceTable's `pagination-changed` calls. That event fires when the table
 * MOUNTS as well, on top of the query's own first load, so the same request would be made twice;
 * each request is keyed by everything it depends on and an identical one is not repeated (a failed
 * one clears the key, so asking again really asks again).
 */
export function useClusterPage(query: () => ClusterPageQuery) {
  const store = useStore();
  const rows: Ref<unknown[]> = ref([]);
  const count = ref(0);
  const loading = ref(false);
  const error = ref('');
  const page = ref(1);
  let lastKey = '';

  async function load(pagination?: { page?: number; perPage?: number }) {
    const q = query();

    if (!q.cluster) {
      rows.value = [];
      count.value = 0;

      return;
    }

    const pageNo = pagination?.page || page.value;
    const pageSize = pagination?.perPage || q.perPage;
    const key = JSON.stringify([q.resource, q.cluster, q.filters || [], q.sort || [], pageNo, pageSize]);

    if (key === lastKey) {
      return;
    }

    lastKey = key;
    page.value = pageNo;
    loading.value = true;
    error.value = '';

    try {
      const res = await fetchClusterPage(store, {
        resource: q.resource, cluster: q.cluster, page: pageNo, pageSize, sort: q.sort, filters: q.filters || []
      });

      rows.value = res.rows;
      count.value = res.count;
    } catch (e) {
      rows.value = [];
      count.value = 0;
      lastKey = '';
      error.value = (e as Error)?.message || `Could not read ${ q.resource } from cluster “${ q.cluster }”.`;
    } finally {
      loading.value = false;
    }
  }

  // A different question starts again at page one.
  watch(() => JSON.stringify(query()), () => {
    page.value = 1;
    load();
  }, { immediate: true });

  return {
    rows, count, loading, error, load
  };
}
