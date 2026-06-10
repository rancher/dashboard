import {
  ref, computed, watch, onMounted, onBeforeUnmount
} from 'vue';
import { useStore } from 'vuex';
import { useRouter, type RouteLocationRaw } from 'vue-router';
import { NAMESPACE } from '@shell/config/types';
import type { StateColor } from '@shell/utils/style';
import { useI18n } from '@shell/composables/useI18n';
import { useStateColor } from '@shell/composables/useStateColor';
import { stateDisplay } from '@shell/plugins/dashboard-store/resource-class';
import { ALL_NAMESPACES } from '@shell/store/prefs';
import {
  NAMESPACE_FILTER_ALL_USER,
  NAMESPACE_FILTER_ALL_SYSTEM,
  NAMESPACE_FILTER_P_FULL_PREFIX,
  NAMESPACE_FILTER_NS_FULL_PREFIX,
} from '@shell/utils/namespace-filter';
import stevePaginationUtils from '@shell/plugins/steve/steve-pagination-utils';
import {
  WORKLOAD_RESOURCE_TYPES, COLOR_ORDER,
  type WorkloadDashboardSummaryEntry,
  type WorkloadDashboardEntry,
  type WorkloadDashboardStateCard,
  type WorkloadDashboardByStateLayout,
  type WorkloadDashboardByTypeCard,
  type WorkloadDashboardByNamespaceCard,
} from './types';

export function useWorkloadDashboard() {
  const store = useStore();
  const router = useRouter();
  const { t } = useI18n(store);
  const { toStateColor, resolveStateColors } = useStateColor();

  const summaries = ref<WorkloadDashboardSummaryEntry[]>([]);
  const fetchError = ref<string | null>(null);
  const loading = ref(true);
  let pollTimer: ReturnType<typeof setInterval> | null = null;

  const clusterId = computed<string>(() => store.getters['clusterId']);

  // ── Namespace filtering ──

  const isAllNamespaces = computed<boolean>(() => store.getters['isAllNamespaces']);

  const namespaceFilterParam = ref('');

  function buildNamespaceFilterParam(): string {
    const selection: string[] = store.getters['namespaceFilters'];
    const { projectsOrNamespaces, filters } = stevePaginationUtils.createParamsFromNsFilter({
      allNamespaces:                 store.getters['cluster/all'](NAMESPACE),
      selection,
      isAllNamespaces:               isAllNamespaces.value,
      isLocalCluster:                store.getters['currentCluster']?.isLocal,
      showReservedRancherNamespaces: store.getters['prefs/get'](ALL_NAMESPACES),
      productHidesSystemNamespaces:  store.getters['currentProduct']?.hideSystemResources,
    });

    // Getting the first schema is sufficient since the namespace filter param structure is the same across all resource types
    const schema = WORKLOAD_RESOURCE_TYPES
      .map((type) => store.getters['cluster/schemaFor'](type))
      .find((s) => !!s);

    // To generate proper params path to be used
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

  watch(() => store.getters['namespaceFilters'], () => {
    namespaceFilterParam.value = buildNamespaceFilterParam();
  }, { immediate: true });

  // ── Subtitle ──

  const totalWorkloads = computed<number>(() => {
    return workloadData.value.reduce((sum, w) => sum + (w.error ? 0 : w.total), 0);
  });

  const namespaceSubtitle = computed<string>(() => {
    const count = totalWorkloads.value;
    const countSuffix = t('workloadDashboard.workloadCount', { count });
    const filters: string[] = store.getters['namespaceFilters'];

    if (isAllNamespaces.value) {
      return `${ t('workloadDashboard.subtitle.allNamespaces') } ${ countSuffix }`;
    }

    if (filters.length === 1) {
      const filter = filters[0];

      if (filter === NAMESPACE_FILTER_ALL_USER) {
        return `${ t('workloadDashboard.subtitle.userNamespaces') } ${ countSuffix }`;
      }

      if (filter === NAMESPACE_FILTER_ALL_SYSTEM) {
        return `${ t('workloadDashboard.subtitle.systemNamespaces') } ${ countSuffix }`;
      }

      if (filter.startsWith(NAMESPACE_FILTER_P_FULL_PREFIX)) {
        const projectId = filter.replace(NAMESPACE_FILTER_P_FULL_PREFIX, '');
        const projects = store.getters['management/all']('management.cattle.io.project');
        const project = projects.find((p: { id?: string; nameDisplay?: string; metadata?: { name: string } }) => p.id?.endsWith(`/${ projectId }`) || p.metadata?.name === projectId);

        return `${ t('workloadDashboard.subtitle.project', { name: project?.nameDisplay || projectId }) } ${ countSuffix }`;
      }

      if (filter.startsWith(NAMESPACE_FILTER_NS_FULL_PREFIX)) {
        const name = filter.replace(NAMESPACE_FILTER_NS_FULL_PREFIX, '');

        return `${ t('workloadDashboard.subtitle.namespace', { name }) } ${ countSuffix }`;
      }
    }

    return `${ t('workloadDashboard.subtitle.multipleSelected', { selected: filters.length }) } ${ countSuffix }`;
  });

  // ── Workload data ──

  const workloadData = computed<WorkloadDashboardEntry[]>(() => {
    return summaries.value.map((entry) => {
      const label = t(`typeLabel."${ entry.type }"`, { count: 2 })?.trim() || entry.type;
      const stateCounts: Record<string, number> = {};
      let total = 0;

      if (entry.summary) {
        for (const s of entry.summary) {
          if (s.property === 'metadata.state.name') {
            for (const [state, detail] of Object.entries(s.counts)) {
              stateCounts[state] = detail.total;
              total += detail.total;
            }
          }
        }
      }

      return {
        type:  entry.type,
        label,
        total,
        stateCounts,
        error: entry.error,
      };
    });
  });

  const hasWorkloads = computed<boolean>(() => {
    return workloadData.value.some((w) => !w.error && w.total > 0);
  });

  // ── By State cards ──

  const byStateCards = computed<WorkloadDashboardStateCard[]>(() => {
    const colorGroups: Record<string, Record<string, { count: number; type: string; stateNames: Set<string> }>> = {
      error:    {},
      warning:  {},
      info:     {},
      success:  {},
      disabled: {},
    };

    for (const w of workloadData.value) {
      if (w.error || w.total === 0) {
        continue;
      }

      for (const [state, count] of Object.entries(w.stateCounts)) {
        const color = toStateColor(state, w.type);

        if (!colorGroups[color][w.label]) {
          colorGroups[color][w.label] = {
            count: 0, type: w.type, stateNames: new Set()
          };
        }
        colorGroups[color][w.label].count += count;
        colorGroups[color][w.label].stateNames.add(state);
      }
    }

    return Object.entries(colorGroups)
      .filter(([, typeMap]) => Object.keys(typeMap).length > 0)
      .map(([color, typeMap]) => ({
        color: color as StateColor,
        rows:  Object.entries(typeMap).map(([label, { count, type, stateNames }]) => ({
          label,
          color:      color as StateColor,
          type,
          stateNames: Array.from(stateNames),
          counts:     [{ label: '', count }],
        })),
      }));
  });

  const byStateLayout = computed<WorkloadDashboardByStateLayout>(() => {
    const cards = byStateCards.value;
    const hero = cards.find((c) => c.color === 'success') ||
      cards.find((c) => c.color === 'info') ||
      cards.find((c) => c.color === 'error') ||
      (cards.length === 1 ? cards[0] : null) || null;

    const others = cards.filter((c) => c !== hero);

    let heroMode: 'default' | 'full' | 'wide' = 'default';

    if (cards.length === 1) {
      heroMode = 'full';
    } else if (others.length === 1) {
      heroMode = 'wide';
    }

    const subHero =
      (hero && others.length >= 3) ? others.find((c) => c.color === 'info') ||
        null : null;

    const regularCards = subHero ? others.filter((c) => c !== subHero) : others;
    const gridRows = subHero ? Math.max(1, regularCards.length) : Math.max(1, Math.ceil(regularCards.length / 2));

    return {
      hero,
      subHero,
      cards: regularCards,
      heroMode,
      gridRows,
    };
  });

  // ── By Type cards ──

  const byTypeCards = computed<WorkloadDashboardByTypeCard[]>(() => {
    return workloadData.value.filter((w) => !w.error && w.total > 0).map((w) => {
      const resources = Object.entries(w.stateCounts)
        .sort(([a], [b]) => (COLOR_ORDER[toStateColor(a, w.type)] ?? 5) - (COLOR_ORDER[toStateColor(b, w.type)] ?? 5))
        .map(([state, count]) => ({
          stateDisplay:     stateDisplay(state, true),
          stateId:          state,
          stateSimpleColor: toStateColor(state, w.type),
          count,
        }));

      return {
        title: w.label,
        type:  w.type,
        resources,
      };
    });
  });

  // ── By Namespace cards ──

  const byNamespaceCards = computed<WorkloadDashboardByNamespaceCard[]>(() => {
    // namespace -> type -> color -> { count, stateNames }
    const nsMap: Record<string, Record<string, Record<string, { count: number; stateNames: Set<string> }>>> = {};

    for (const entry of summaries.value) {
      if (entry.error || !entry.summary) {
        continue;
      }

      for (const s of entry.summary) {
        if (s.property !== 'metadata.state.name') {
          continue;
        }

        for (const [state, detail] of Object.entries(s.counts)) {
          const color = toStateColor(state, entry.type);

          for (const [ns, count] of Object.entries(detail.namespace)) {
            if (!nsMap[ns]) {
              nsMap[ns] = {};
            }
            if (!nsMap[ns][entry.type]) {
              nsMap[ns][entry.type] = {};
            }
            if (!nsMap[ns][entry.type][color]) {
              nsMap[ns][entry.type][color] = { count: 0, stateNames: new Set() };
            }
            nsMap[ns][entry.type][color].count += count;
            nsMap[ns][entry.type][color].stateNames.add(state);
          }
        }
      }
    }

    return Object.entries(nsMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([ns, typeMap]) => {
        const rows = WORKLOAD_RESOURCE_TYPES
          .filter((type) => typeMap[type])
          .map((type) => {
            const label = t(`typeLabel."${ type }"`, { count: 2 })?.trim() || type;
            const counts = Object.entries(typeMap[type])
              .sort(([a], [b]) => (COLOR_ORDER[a] ?? 5) - (COLOR_ORDER[b] ?? 5))
              .map(([color, { count, stateNames }]) => ({
                color:      color as StateColor,
                count,
                stateNames: Array.from(stateNames),
              }));

            return {
              label, type, counts
            };
          });

        return { title: ns, rows };
      });
  });

  // ── Actions ──

  function resetNamespaceFilter(): void {
    store.dispatch('switchNamespaces', {
      ids: [],
      key: clusterId.value,
    });
  }

  function filterByNamespace(namespace: string): void {
    store.dispatch('switchNamespaces', {
      ids: [`${ NAMESPACE_FILTER_NS_FULL_PREFIX }${ namespace }`],
      key: clusterId.value,
    });
  }

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

  function navigateToNamespace(type: string, namespace: string, stateNames?: string[]): void {
    filterByNamespace(namespace);
    router.push(resourceRoute(type, stateNames));
  }

  // ── Fetching & polling ──

  async function fetchSummaries(): Promise<void> {
    try {
      const accessibleTypes = WORKLOAD_RESOURCE_TYPES.filter(
        (type) => store.getters['cluster/canList'](type)
      );

      const workloadPromises = accessibleTypes.map(async(type): Promise<WorkloadDashboardSummaryEntry> => {
        try {
          let url = `${ store.getters['cluster/urlFor'](type) }`;

          if (namespaceFilterParam.value) {
            url += `&${ namespaceFilterParam.value }`;
          }
          url += `&summary=metadata.state.name&summaryonly&summarynamespaced`;

          const res = await store.dispatch('cluster/request', { url });

          return {
            type, summary: res.summary || [], error: null
          };
        } catch (e: unknown) {
          const message = e instanceof Error ? e.message : t('workloadDashboard.errors.fetchType', { type });

          return {
            type, summary: null, error: message
          };
        }
      });

      const results = await Promise.all(workloadPromises);

      await resolveStateColors(results);
      summaries.value = results;
      fetchError.value = null;
    } catch (e: unknown) {
      fetchError.value = e instanceof Error ? e.message : t('workloadDashboard.errors.fetchAll');
    }
  }

  function stopPollTimer(): void {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  }

  function startPollTimer(): void {
    stopPollTimer();

    pollTimer = setInterval(() => {
      fetchSummaries();
    }, 5000);
  }

  function handleVisibilityChange(): void {
    if (document.hidden) {
      stopPollTimer();
    } else {
      fetchSummaries();
      startPollTimer();
    }
  }

  watch(namespaceFilterParam, () => {
    fetchSummaries();
    startPollTimer();
  });

  onMounted(async() => {
    await fetchSummaries();
    loading.value = false;
    startPollTimer();
    document.addEventListener('visibilitychange', handleVisibilityChange);
  });

  onBeforeUnmount(() => {
    stopPollTimer();
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  });

  return {
    loading,
    fetchError,
    hasWorkloads,
    namespaceSubtitle,
    byStateLayout,
    byTypeCards,
    byNamespaceCards,
    resetNamespaceFilter,
    filterByNamespace,
    resourceRoute,
    navigateToNamespace,
  };
}
