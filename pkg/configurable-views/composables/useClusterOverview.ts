import {
  computed, onBeforeUnmount, onMounted, ref, toValue, watch, type MaybeRefOrGetter
} from 'vue';
import { useStore } from 'vuex';
import { useRouter, type RouteLocationRaw } from 'vue-router';
import { NAMESPACE } from '@shell/config/types';
import { NAME as EXPLORER } from '@shell/config/product/explorer';
import type { StateColor } from '@shell/utils/style';
import { useI18n } from '@shell/composables/useI18n';
import { useStateColor } from '@shell/composables/useStateColor';
import { stateDisplay } from '@shell/plugins/dashboard-store/resource-class';
import { NAMESPACE_FILTER_NS_FULL_PREFIX } from '@shell/utils/namespace-filter';
import {
  WORKLOAD_DASHBOARD_RESOURCE_TYPES, COLOR_ORDER,
  type WorkloadDashboardStateCard,
  type WorkloadDashboardByStateLayout,
  type WorkloadDashboardByTypeCard,
  type WorkloadDashboardByNamespaceCard,
} from '@shell/pages/c/_cluster/explorer/workload-dashboard/types';
import { fetchStateSummaries, type StateSummary } from '../templating/widget-data';

// The Workloads overview's numbers - by state, by type, by namespace - for ONE NAMED cluster.
//
// The overview's own composable (explorer/workload-dashboard/composable.ts) asks the `cluster` store,
// which holds only the cluster that is open, and filters by that cluster's namespace picker. This is
// its data step with the cluster made a parameter: the same summary request against the named
// cluster's API, grouped into exactly the shapes the overview's By State / By Type / By Namespace
// sections draw, so the widget renders those sections as they are. Being about a cluster that may not
// be open, it counts every namespace rather than following the open cluster's picker.
//
// It polls, as the overview does, but less often - it is one widget of several on a page - and not
// while the tab is hidden.

const POLL_MS = 10000;

interface TypeEntry {
  type: string;
  label: string;
  total: number;
  stateCounts: Record<string, number>;
}

export function useClusterOverview(cluster: MaybeRefOrGetter<string>) {
  const store = useStore();
  const router = useRouter();
  const { t } = useI18n(store);
  const { toStateColor, resolveStateColors } = useStateColor();

  const summaries = ref<StateSummary[]>([]);
  const loading = ref(false);
  const error = ref('');
  let pollTimer: ReturnType<typeof setInterval> | null = null;
  // A cluster change mid-request must not let the old cluster's answer land.
  let asked = 0;

  const labelOf = (type: string) => t(`typeLabel."${ type }"`, { count: 2 })?.trim() || type;

  const entries = computed<TypeEntry[]>(() => summaries.value.filter((e) => !e.error).map((e) => {
    const stateCounts: Record<string, number> = {};
    let total = 0;

    for (const s of e.summary || []) {
      if (s.property === 'metadata.state.name') {
        for (const [state, detail] of Object.entries(s.counts)) {
          stateCounts[state] = detail.total;
          total += detail.total;
        }
      }
    }

    return {
      type: e.type, label: labelOf(e.type), total, stateCounts
    };
  }));

  const hasWorkloads = computed(() => entries.value.some((e) => e.total > 0));

  // ── By State: one card per colour, one row per type in it ──
  const byStateLayout = computed<WorkloadDashboardByStateLayout>(() => {
    const groups: Record<string, Record<string, { count: number; type: string; stateNames: Set<string> }>> = {
      error: {}, warning: {}, info: {}, success: {}, disabled: {},
    };

    for (const e of entries.value) {
      for (const [state, count] of Object.entries(e.stateCounts)) {
        const color = toStateColor(state, e.type);
        const row = groups[color][e.label] || (groups[color][e.label] = {
          count: 0, type: e.type, stateNames: new Set()
        });

        row.count += count;
        row.stateNames.add(state);
      }
    }

    const cards: WorkloadDashboardStateCard[] = Object.entries(groups)
      .filter(([, rows]) => Object.keys(rows).length)
      .map(([color, rows]) => ({
        color: color as StateColor,
        rows:  Object.entries(rows).map(([label, { count, type, stateNames }]) => ({
          label, color: color as StateColor, type, stateNames: Array.from(stateNames), counts: [{ label: '', count }]
        })),
      }));

    // The overview's own emphasis: healthy first, else informational, else the errors.
    const hero = cards.find((c) => c.color === 'success') || cards.find((c) => c.color === 'info') ||
      cards.find((c) => c.color === 'error') || (cards.length === 1 ? cards[0] : null) || null;
    const others = cards.filter((c) => c !== hero);
    const subHero = hero && others.length >= 2 ? others.find((c) => c.color === 'info') || null : null;

    return {
      hero, subHero, cards: subHero ? others.filter((c) => c !== subHero) : others
    };
  });

  // ── By Type: one card per type, its states worst first ──
  const byTypeCards = computed<WorkloadDashboardByTypeCard[]>(() => entries.value.filter((e) => e.total > 0).map((e) => ({
    title:     e.label,
    type:      e.type,
    resources: Object.entries(e.stateCounts)
      .sort(([a], [b]) => (COLOR_ORDER[toStateColor(a, e.type)] ?? 5) - (COLOR_ORDER[toStateColor(b, e.type)] ?? 5))
      .map(([state, count]) => ({
        stateDisplay: stateDisplay(state, true), stateId: state, stateSimpleColor: toStateColor(state, e.type), count
      })),
  })));

  // ── By Namespace: one card per namespace, a row per type, a count per colour ──
  const byNamespaceCards = computed<WorkloadDashboardByNamespaceCard[]>(() => {
    const byNs: Record<string, Record<string, Record<string, { count: number; stateNames: Set<string> }>>> = {};

    for (const e of summaries.value) {
      for (const s of (e.error ? [] : e.summary || [])) {
        if (s.property !== 'metadata.state.name') {
          continue;
        }
        for (const [state, detail] of Object.entries(s.counts)) {
          const color = toStateColor(state, e.type);

          for (const [ns, count] of Object.entries(detail.namespace || {})) {
            const types = byNs[ns] || (byNs[ns] = {});
            const colors = types[e.type] || (types[e.type] = {});
            const cell = colors[color] || (colors[color] = { count: 0, stateNames: new Set() });

            cell.count += count;
            cell.stateNames.add(state);
          }
        }
      }
    }

    return Object.entries(byNs).sort(([a], [b]) => a.localeCompare(b)).map(([ns, types]) => ({
      title: ns,
      rows:  WORKLOAD_DASHBOARD_RESOURCE_TYPES.filter((type) => types[type]).map((type) => ({
        label:  labelOf(type),
        type,
        counts: Object.entries(types[type])
          .sort(([a], [b]) => (COLOR_ORDER[a] ?? 5) - (COLOR_ORDER[b] ?? 5))
          .map(([color, { count, stateNames }]) => ({
            color: color as StateColor, count, stateNames: Array.from(stateNames)
          })),
      })),
    }));
  });

  // ── Where the cards lead: into THIS cluster ──

  function resourceRoute(type: string, stateNames?: string[]): RouteLocationRaw {
    return {
      name:   'c-cluster-product-resource',
      params: {
        cluster: toValue(cluster), product: EXPLORER, resource: type
      },
      ...(stateNames?.length ? { query: { stateFilter: stateNames.join(',') } } : {}),
    };
  }

  // The namespace picker belongs to the cluster that is open. For that cluster a namespace card
  // narrows it, as the overview's does; for any other it leads to the namespace itself.
  function filterByNamespace(namespace: string): void {
    const id = toValue(cluster);

    if (store.getters['clusterId'] === id) {
      store.dispatch('switchNamespaces', { ids: [`${ NAMESPACE_FILTER_NS_FULL_PREFIX }${ namespace }`], key: id });

      return;
    }

    router.push({
      name:   'c-cluster-product-resource-id',
      params: {
        cluster: id, product: EXPLORER, resource: NAMESPACE, id: namespace
      },
    });
  }

  function navigateToNamespace(type: string, namespace: string, stateNames?: string[]): void {
    if (store.getters['clusterId'] === toValue(cluster)) {
      filterByNamespace(namespace);
    }
    router.push(resourceRoute(type, stateNames));
  }

  // ── Fetching & polling ──

  async function load(): Promise<void> {
    const id = toValue(cluster);
    const mine = ++asked;

    if (!id) {
      summaries.value = [];

      return;
    }

    try {
      const results = await fetchStateSummaries(store, id, WORKLOAD_DASHBOARD_RESOURCE_TYPES);

      if (mine !== asked) {
        return;
      }

      await resolveStateColors(results);
      summaries.value = results;
      error.value = results.every((r) => r.error) ? `Could not read the workloads of cluster “${ id }”.` : '';
    } catch (e) {
      if (mine === asked) {
        error.value = (e as Error)?.message || `Could not read the workloads of cluster “${ id }”.`;
      }
    }
  }

  function stop(): void {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  }

  function start(): void {
    stop();
    pollTimer = setInterval(load, POLL_MS);
  }

  function onVisibility(): void {
    if (document.hidden) {
      stop();
    } else {
      load();
      start();
    }
  }

  watch(() => toValue(cluster), async() => {
    summaries.value = [];
    error.value = '';
    loading.value = true;
    await load();
    loading.value = false;
  });

  onMounted(async() => {
    loading.value = true;
    await load();
    loading.value = false;
    start();
    document.addEventListener('visibilitychange', onVisibility);
  });

  onBeforeUnmount(() => {
    stop();
    document.removeEventListener('visibilitychange', onVisibility);
  });

  return {
    loading, error, hasWorkloads, byStateLayout, byTypeCards, byNamespaceCards, resourceRoute, filterByNamespace, navigateToNamespace
  };
}
