import {
  ref, computed, watch, onBeforeUnmount, toValue, type MaybeRefOrGetter
} from 'vue';
import { useStore } from 'vuex';
import debounce from 'lodash/debounce';
import { COUNT } from '@shell/config/types';
import { useStateColor, type StateSummaryEntry } from '@shell/composables/useStateColor';
import { useNamespaceFilterParam } from '@shell/composables/useNamespaceFilterParam';
import { DEFAULT_RESOURCE_STATUS_WIDGET_PROPERTY, type ResourceStatusWidgetProperty } from './types';

/**
 * Delay before refetching summaries after counts change. Counts can change many times in a row
 * (e.g. a rollout), this keeps it to one round of requests.
 */
export const REFETCH_DEBOUNCE_MS = 500;

/**
 * Delay before fetching again when a summary could not be fetched. Matches the workload dashboard poll
 */
export const RETRY_INTERVAL_MS = 5000;

interface CountEntry {
  summary?: { count?: number; states?: Record<string, number> };
}

export interface UseResourceStateSummariesOptions {
  /** Defaults to `metadata.state.name` */
  property?: MaybeRefOrGetter<ResourceStatusWidgetProperty | undefined>;
  /** Apply the namespace filter to namespaced types. Defaults to true */
  followNamespaceFilter?: MaybeRefOrGetter<boolean | undefined>;
}

/**
 * Counts per state for each of the given types.
 *
 * Counts come from steve summary requests (`?summary=metadata.state.name`). They are refetched when
 * the types, the live resource counts of the types or (when followed) the namespace filter change.
 * When a summary cannot be fetched it is retried every few seconds, while the browser tab is visible.
 */
export function useResourceStateSummaries(types: MaybeRefOrGetter<string[]>, options: UseResourceStateSummariesOptions = {}) {
  const store = useStore();
  const { resolveStateColors } = useStateColor();

  const property = computed<ResourceStatusWidgetProperty>(() => toValue(options.property) || DEFAULT_RESOURCE_STATUS_WIDGET_PROPERTY);
  const followNamespaceFilter = computed<boolean>(() => toValue(options.followNamespaceFilter) ?? true);

  const namespaceFilterParam = useNamespaceFilterParam(types);

  const summaries = ref<StateSummaryEntry[]>([]);
  const loaded = ref(false);
  let requestId = 0;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;
  let retryWhenVisible = false;

  const counts = computed<Record<string, CountEntry>>(() => store.getters['cluster/all'](COUNT)?.[0]?.counts || {});

  // Changes when anything that affects the summaries changes
  const refetchSignature = computed<string>(() => JSON.stringify([property.value, toValue(types).map((type) => [type, counts.value[type]?.summary])]));

  // ── Fetching ──

  function filtersByNamespace(type: string): boolean {
    return followNamespaceFilter.value && !!namespaceFilterParam.value && !!store.getters['cluster/schemaFor'](type)?.attributes?.namespaced;
  }

  async function fetchSummary(type: string): Promise<StateSummaryEntry> {
    try {
      let url = store.getters['cluster/urlFor'](type);

      if (filtersByNamespace(type)) {
        url += `&${ namespaceFilterParam.value }`;
      }
      url += `&summary=${ property.value }&summaryonly`;

      const res = await store.dispatch('cluster/request', { url });

      return { type, summary: res?.summary || [] };
    } catch {
      return { type, summary: null };
    }
  }

  function clearRetry(): void {
    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }
    retryWhenVisible = false;
  }

  function scheduleRetry(): void {
    retryTimer = setTimeout(() => {
      retryTimer = null;

      // Don't send requests from a background tab, retry once it is visible again
      if (document.hidden) {
        retryWhenVisible = true;
      } else {
        fetchSummaries();
      }
    }, RETRY_INTERVAL_MS);
  }

  function onVisibilityChange(): void {
    if (!document.hidden && retryWhenVisible) {
      fetchSummaries();
    }
  }

  async function fetchSummaries(): Promise<void> {
    // This request replaces any pending retry
    clearRetry();

    const id = ++requestId;
    const results = await Promise.all(toValue(types).map(fetchSummary));

    // A newer request was started while this one was running
    if (id !== requestId) {
      return;
    }

    await resolveStateColors(results);

    if (id !== requestId) {
      return;
    }

    summaries.value = results;
    loaded.value = true;

    if (results.some((r) => !r.summary)) {
      scheduleRetry();
    }
  }

  const debouncedFetch = debounce(fetchSummaries, REFETCH_DEBOUNCE_MS);

  watch(refetchSignature, (neu, old) => {
    // Fetch straight away the first time, then wait for changes to settle
    if (old === undefined) {
      fetchSummaries();
    } else {
      debouncedFetch();
    }
  }, { immediate: true });

  // Changing the namespace filter is a user action, so show the result without waiting
  watch(() => (followNamespaceFilter.value ? namespaceFilterParam.value : null), () => {
    debouncedFetch.cancel();
    fetchSummaries();
  });

  document.addEventListener('visibilitychange', onVisibilityChange);

  onBeforeUnmount(() => {
    debouncedFetch.cancel();
    clearRetry();
    document.removeEventListener('visibilitychange', onVisibilityChange);
    // Ignore any response that is still on its way
    requestId++;
  });

  /**
   * State name to count for a type, or null when its summary could not be fetched
   */
  function stateCounts(type: string): Record<string, number> | null {
    const entry = summaries.value.find((s) => s.type === type);

    if (!entry?.summary) {
      return null;
    }

    const out: Record<string, number> = {};

    for (const s of entry.summary) {
      if (s.property === property.value) {
        for (const [state, detail] of Object.entries(s.counts || {})) {
          out[state] = detail.total;
        }
      }
    }

    return out;
  }

  return {
    loaded,
    stateCounts,
  };
}
