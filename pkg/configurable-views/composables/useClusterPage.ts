import { ref, watch, type Ref } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import { fetchClusterPage, type SteveSort } from '../templating/widget-data';
import type { ResourceRow } from '../templating/types';

export interface ClusterPageQuery {
  resource: string;
  /** '' reads nothing: the widget has no cluster to read from. */
  cluster: string;
  perPage: number;
  /** A fixed order, as Steve fields. */
  sort?: SteveSort[];
  /**
   * Read up to a capped number of rows at once rather than a page, for a table that pages, sorts and
   * filters them itself.
   */
  whole?: boolean;
}

/**
 * A type from one named cluster, a page at a time - the server pages, the table shows it.
 *
 * `load` is what a ResourceTable's `pagination-changed` calls. That event fires when the table
 * MOUNTS as well, on top of the query's own first load, so the same request would be made twice;
 * each request is keyed by everything it depends on and an identical one is not repeated (a failed
 * one clears the key, so asking again really asks again).
 */
export function useClusterPage(query: () => ClusterPageQuery) {
  const store = useStore();
  const { t } = useI18n(store);
  const rows: Ref<ResourceRow[]> = ref([]);
  const count = ref(0);
  const loading = ref(false);
  const error = ref('');
  /** The filter could not be applied to all of the cluster's rows - only to the first `cap` of them. */
  const truncated = ref(false);
  /** The rows are one page the server cut, as opposed to everything, paged in the browser. */
  const serverPaged = ref(false);
  const page = ref(1);
  let lastKey = '';

  async function load(pagination?: { page?: number; perPage?: number }): Promise<void> {
    const q = query();

    if (!q.cluster) {
      rows.value = [];
      count.value = 0;

      return;
    }

    const pageNo = pagination?.page || page.value;
    const pageSize = pagination?.perPage || q.perPage;
    const key = JSON.stringify([q.resource, q.cluster, q.sort || [], !!q.whole, pageNo, pageSize]);

    if (key === lastKey) {
      return;
    }

    lastKey = key;
    page.value = pageNo;
    loading.value = true;
    error.value = '';

    try {
      const res = await fetchClusterPage(store, {
        resource: q.resource,
        cluster:  q.cluster,
        page:     pageNo,
        pageSize,
        sort:     q.sort,
        whole:    q.whole,
      });

      rows.value = res.rows;
      count.value = res.count;
      truncated.value = res.truncated;
      serverPaged.value = res.serverPaged;
    } catch (e) {
      rows.value = [];
      count.value = 0;
      lastKey = '';
      error.value = (e as Error)?.message || t('configurableViews.errors.resource', { resource: q.resource, cluster: q.cluster });
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
    rows, count, loading, error, truncated, serverPaged, load
  };
}
