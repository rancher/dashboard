import {
  computed, ref, toValue, watch, type MaybeRefOrGetter
} from 'vue';
import { useStore } from 'vuex';
import { applyFilter, applySort, fieldValue, storeForType } from '../templating/widget-data';
import type { ResourceRow, WidgetSpec } from '../templating/types';

/**
 * The rows a data-backed widget draws: fetch the spec's resource, then apply its Where / Filter /
 * Sort.
 *
 * "Where" is deliberately coarse, matching the settings panel — `view` is everything the person can
 * see, `custom` only the clusters or namespaces in `targets`. Cluster scoping is a server-side idea
 * the Home can only approximate, so `custom` matches on a row's cluster or namespace name.
 */
export function useWidgetRows(widgetRef: MaybeRefOrGetter<WidgetSpec>) {
  const store = useStore();
  const allRows = ref<ResourceRow[]>([]);
  const loading = ref(true);
  const error = ref('');

  const widget = computed(() => toValue(widgetRef));
  const inStore = computed(() => storeForType(store.getters, widget.value.resource));
  const schema = computed(() => (widget.value.resource ? store.getters[`${ inStore.value }/schemaFor`](widget.value.resource) : null));

  const inTargets = (row: ResourceRow) => {
    const targets = (widget.value.targets || []).map((t) => t.toLowerCase());
    const candidates = [fieldValue(row, 'namespace'), row.clusterName, row.spec?.clusterName].filter(Boolean);

    return candidates.some((c) => targets.includes(`${ c }`.toLowerCase()));
  };

  const rows = computed(() => {
    const w = widget.value;
    const scoped = w.where === 'custom' && w.targets?.length ? allRows.value.filter(inTargets) : allRows.value;

    return applySort(applyFilter(scoped, w.filter), w.sortBy, w.sortDir);
  });

  /** What a list caps itself at; 0 means no cap. */
  const visibleRows = computed(() => (widget.value.limit ? rows.value.slice(0, widget.value.limit) : rows.value));

  /**
   * It matters WHY there is nothing to draw: a type with no instances is a different answer from a
   * filter that matched none, and neither is an error.
   */
  const emptyText = computed(() => {
    const kind = schema.value?.attributes?.kind || widget.value.resource?.split('.').pop() || 'item';

    return allRows.value.length ? `No ${ kind } matches this widget's filter.` : `No ${ kind } here yet.`;
  });

  async function load() {
    error.value = '';

    if (!widget.value.resource) {
      allRows.value = [];
      loading.value = false;

      return;
    }

    loading.value = true;

    try {
      if (!schema.value) {
        allRows.value = [];
        error.value = `Rancher has no "${ widget.value.resource }" here — the type may not be installed, or you may not have permission to see it.`;

        return;
      }

      allRows.value = await store.dispatch(`${ inStore.value }/findAll`, { type: widget.value.resource }) || [];
    } catch (e) {
      allRows.value = [];
      error.value = (e as Error)?.message || `Could not load ${ widget.value.resource }.`;
    } finally {
      loading.value = false;
    }
  }

  // The resource is the only thing a re-fetch depends on — the rest is applied client-side.
  watch(() => widget.value.resource, load, { immediate: true });

  return {
    rows, visibleRows, loading, error, emptyText, schema, fieldValue, reload: load
  };
}
