import { ref, computed, watch, onBeforeUnmount } from 'vue';
import { useStore } from 'vuex';
import type { RouteLocationRaw } from 'vue-router';
import debounce from 'lodash/debounce';
import { COUNT, NODE, WORKLOAD_TYPES } from '@shell/config/types';
import type { StateColor } from '@shell/utils/style';
import { useStateColor, type StateSummaryEntry } from '@shell/composables/useStateColor';
import { useNamespaceFilterParam } from '@shell/composables/useNamespaceFilterParam';
import type { StatusSummaryCardItem } from '@shell/components/Resource/Detail/Card/StatusSummaryCard/types';
import { buildStatusSummaryCard, compareStateColors } from '@shell/components/Resource/Detail/Card/StatusSummaryCard/utils';
import type { StatusBreakdownRow } from '@shell/components/Resource/Detail/Card/StatusBreakdownCard/types';
import { WORKLOAD_DASHBOARD_RESOURCE_TYPES } from '../workload-dashboard/types';

const DEPLOYMENT = WORKLOAD_TYPES.DEPLOYMENT;

/**
 * Types that can appear in the "Other, Unhealthy Workloads" card
 */
const OTHER_WORKLOAD_TYPES = WORKLOAD_DASHBOARD_RESOURCE_TYPES.filter((type) => type !== DEPLOYMENT);

/**
 * Colors shown in the "Other, Unhealthy Workloads" card
 */
const UNHEALTHY_COLORS: StateColor[] = ['error', 'warning'];

/**
 * Delay before refetching summaries after counts change. Counts can change many times in a row
 * (e.g. a rollout), this keeps it to one round of requests.
 */
export const REFETCH_DEBOUNCE_MS = 500;

interface CountEntry {
  summary?: { count?: number; states?: Record<string, number> };
}

/**
 * State counts for the cluster dashboard status cards: Nodes, Deployments and "Other, Unhealthy
 * Workloads".
 *
 * Counts come from steve summary requests (`?summary=metadata.state.name`). Deployments and other
 * workloads follow the namespace filter, nodes are cluster scoped so they always cover the whole
 * cluster. They are refetched when the live resource counts or the namespace filter change.
 */
export function useClusterResourceStatus() {
  const store = useStore();
  const { toStateColor, resolveStateColors } = useStateColor();

  const namespaceFilterParam = useNamespaceFilterParam(WORKLOAD_DASHBOARD_RESOURCE_TYPES);

  const summaries = ref<StateSummaryEntry[]>([]);
  const loaded = ref(false);
  let requestId = 0;

  const clusterId = computed<string>(() => store.getters['clusterId']);

  const counts = computed<Record<string, CountEntry>>(() => store.getters['cluster/all'](COUNT)?.[0]?.counts || {});

  const canListDeployments = computed<boolean>(() => !!store.getters['cluster/canList'](DEPLOYMENT));
  const canListNodes = computed<boolean>(() => !!store.getters['cluster/canList'](NODE));

  /**
   * Workload types, other than deployments, that have items in an error or in-progress state across
   * the cluster. The count API does not give more detail than that, so these are the candidates we
   * fetch summaries for. The namespace filter is applied by the summary request.
   */
  const unhealthyTypes = computed<string[]>(() => {
    return OTHER_WORKLOAD_TYPES
      .filter((type) => {
        if (!Object.values(counts.value[type]?.summary?.states || {}).some((n) => n > 0)) {
          return false;
        }

        const schema = store.getters['cluster/schemaFor'](type);

        return !!schema && !!store.getters['cluster/canList'](type) && !store.getters['type-map/isIgnored'](schema);
      })
      .sort();
  });

  const typesToFetch = computed<string[]>(() => [
    ...(canListDeployments.value ? [DEPLOYMENT] : []),
    ...(canListNodes.value ? [NODE] : []),
    ...unhealthyTypes.value,
  ]);

  // Changes when anything that affects the summaries changes
  const refetchSignature = computed<string>(() => JSON.stringify(typesToFetch.value.map((type) => [type, counts.value[type]?.summary])));

  // ── Fetching ──

  async function fetchSummary(type: string): Promise<StateSummaryEntry> {
    try {
      let url = store.getters['cluster/urlFor'](type);

      if (type !== NODE && namespaceFilterParam.value) {
        url += `&${ namespaceFilterParam.value }`;
      }
      url += '&summary=metadata.state.name&summaryonly';

      const res = await store.dispatch('cluster/request', { url });

      return { type, summary: res?.summary || [] };
    } catch {
      return { type, summary: null };
    }
  }

  async function fetchSummaries(): Promise<void> {
    const id = ++requestId;
    const results = await Promise.all(typesToFetch.value.map(fetchSummary));

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
  watch(namespaceFilterParam, () => {
    debouncedFetch.cancel();
    fetchSummaries();
  });

  onBeforeUnmount(() => {
    debouncedFetch.cancel();
    // Ignore any response that is still on its way
    requestId++;
  });

  // ── Cards ──

  function resourceRoute(type: string, stateNames?: string[]): RouteLocationRaw {
    const loc: { name: string; params: Record<string, string>; query?: Record<string, string> } = {
      name:   'c-cluster-product-resource',
      params: {
        cluster:  clusterId.value,
        product:  'explorer',
        resource: type,
      },
    };

    if (stateNames?.length) {
      loc.query = { stateFilter: stateNames.join(',') };
    }

    return loc;
  }

  function typeLabel(type: string): string {
    const schema = store.getters['cluster/schemaFor'](type);

    return schema ? store.getters['type-map/labelFor'](schema, 2) : type;
  }

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
      if (s.property === 'metadata.state.name') {
        for (const [state, detail] of Object.entries(s.counts || {})) {
          out[state] = detail.total;
        }
      }
    }

    return out;
  }

  function summaryCard(type: string): StatusSummaryCardItem | null {
    const states = stateCounts(type);

    if (!states) {
      return null;
    }

    return buildStatusSummaryCard({
      key:    type,
      title:  typeLabel(type),
      to:     resourceRoute(type),
      states: Object.entries(states).map(([name, count]) => ({
        name, count, color: toStateColor(name, type)
      })),
      stateRoute: (name) => resourceRoute(type, [name]),
    });
  }

  const deploymentsCard = computed<StatusSummaryCardItem | null>(() => (canListDeployments.value ? summaryCard(DEPLOYMENT) : null));

  const nodesCard = computed<StatusSummaryCardItem | null>(() => (canListNodes.value ? summaryCard(NODE) : null));

  const unhealthyRows = computed<StatusBreakdownRow[]>(() => {
    return unhealthyTypes.value
      .map((type): StatusBreakdownRow | null => {
        const states = stateCounts(type);

        if (!states) {
          return null;
        }

        const byColor: Partial<Record<StateColor, { count: number; stateNames: string[] }>> = {};

        for (const [state, count] of Object.entries(states)) {
          const color = toStateColor(state, type);

          if (!count || !UNHEALTHY_COLORS.includes(color)) {
            continue;
          }

          byColor[color] = byColor[color] || { count: 0, stateNames: [] };
          byColor[color].count += count;
          byColor[color].stateNames.push(state);
        }

        const colors = Object.keys(byColor).sort(compareStateColors) as StateColor[];

        if (!colors.length) {
          return null;
        }

        return {
          key:    type,
          label:  typeLabel(type),
          to:     resourceRoute(type),
          counts: colors.map((color) => ({
            color,
            count: byColor[color]!.count,
            to:    resourceRoute(type, byColor[color]!.stateNames),
          })),
        };
      })
      .filter((row): row is StatusBreakdownRow => !!row)
      .sort((a, b) => a.label.localeCompare(b.label));
  });

  return {
    loaded,
    deploymentsCard,
    nodesCard,
    unhealthyRows,
  };
}
