import {
  reactive, ref, computed, watch, onMounted, onBeforeUnmount
} from 'vue';
import { useStore } from 'vuex';
import type { RouteLocationRaw } from 'vue-router';
import { NAMESPACE } from '@shell/config/types';
import { STATES, colorForState } from '@shell/plugins/dashboard-store/resource-class';
import { StateColor } from '@shell/utils/style';
import { useI18n } from '@shell/composables/useI18n';
import { ALL_NAMESPACES } from '@shell/store/prefs';
import {
  NAMESPACE_FILTER_ALL_USER,
  NAMESPACE_FILTER_ALL_SYSTEM,
  NAMESPACE_FILTER_P_FULL_PREFIX,
  NAMESPACE_FILTER_NS_FULL_PREFIX,
} from '@shell/utils/namespace-filter';
import stevePaginationUtils from '@shell/plugins/steve/steve-pagination-utils';
import { PaginationParamFilter } from '@shell/types/store/pagination.types';
import {
  WORKLOAD_RESOURCE_TYPES, COLOR_ORDER,
  type WorkloadDashboardSummaryEntry,
  type WorkloadDashboardEntry,
  type WorkloadDashboardStateCard,
  type WorkloadDashboardByStateLayout,
  type WorkloadDashboardByTypeCard,
} from './types';

const stateColorCache = reactive<Record<string, StateColor>>({});

export function useWorkloadDashboard() {
  const store = useStore();
  const { t } = useI18n(store);

  const summaries = ref<WorkloadDashboardSummaryEntry[]>([]);
  const fetchError = ref<string | null>(null);
  const loading = ref(true);
  let pollTimer: ReturnType<typeof setInterval> | null = null;

  const clusterId = computed<string>(() => store.getters['clusterId']);

  // ── State color cache ──

  function toStateColor(state: string): StateColor {
    const key = (state || '').toLowerCase();

    if (stateColorCache[key]) {
      return stateColorCache[key];
    }

    const config = STATES[key];
    const color = config?.color || 'info';
    const resolved = (color === 'darker' ? 'disabled' : color) as StateColor;

    stateColorCache[key] = resolved;

    return resolved;
  }

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
    const filters: string[] = store.getters['namespaceFilters'];

    if (isAllNamespaces.value) {
      return t('workloadDashboard.subtitle.allNamespaces', { count });
    }

    if (filters.length === 1) {
      const filter = filters[0];

      if (filter === NAMESPACE_FILTER_ALL_USER) {
        return t('workloadDashboard.subtitle.userNamespaces', { count });
      }

      if (filter === NAMESPACE_FILTER_ALL_SYSTEM) {
        return t('workloadDashboard.subtitle.systemNamespaces', { count });
      }

      if (filter.startsWith(NAMESPACE_FILTER_P_FULL_PREFIX)) {
        const projectId = filter.replace(NAMESPACE_FILTER_P_FULL_PREFIX, '');
        const projects = store.getters['management/all']('management.cattle.io.project');
        const project = projects.find((p: any) => p.id?.endsWith(`/${ projectId }`) || p.metadata?.name === projectId);

        return t('workloadDashboard.subtitle.project', { name: project?.nameDisplay || projectId, count });
      }

      if (filter.startsWith(NAMESPACE_FILTER_NS_FULL_PREFIX)) {
        const name = filter.replace(NAMESPACE_FILTER_NS_FULL_PREFIX, '');

        return t('workloadDashboard.subtitle.namespace', { name, count });
      }
    }

    return t('workloadDashboard.subtitle.multipleSelected', { selected: filters.length, count });
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
            Object.assign(stateCounts, s.counts);
            total = Object.values(s.counts).reduce((sum, c) => sum + c, 0);
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
        const color = toStateColor(state);

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
    const hero = cards.find((c) => c.color === 'success') || null;
    const others = cards.filter((c) => c !== hero);

    let heroMode = 'default';

    if (cards.length === 1) {
      heroMode = 'full';
    } else if (others.length === 1) {
      heroMode = 'wide';
    }

    const subHero = (hero && others.length >= 3) ? others.find((c) => c.color === 'info') || null : null;

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
        .sort(([a], [b]) => (COLOR_ORDER[toStateColor(a)] ?? 5) - (COLOR_ORDER[toStateColor(b)] ?? 5))
        .map(([state, count]) => ({
          stateDisplay:     state ? state.charAt(0).toUpperCase() + state.slice(1) : '',
          stateId:          state,
          stateSimpleColor: toStateColor(state),
          count,
        }));

      return {
        title: w.label,
        type:  w.type,
        resources,
      };
    });
  });

  // ── Actions ──

  function resetNamespaceFilter(): void {
    store.dispatch('switchNamespaces', {
      ids: [],
      key: store.getters['clusterId'],
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
      const q = stateNames.map((s) => `"metadata.state.name":"${ s }"`).join(',');

      loc.query = { q };
    }

    return loc;
  }

  // ── State color resolution ──

  async function resolveStateColors(entries: WorkloadDashboardSummaryEntry[]): Promise<void> {
    const unresolvedStates = new Map<string, { originalName: string; type: string }>();

    for (const entry of entries) {
      if (!entry.summary) {
        continue;
      }

      for (const s of entry.summary) {
        if (s.property === 'metadata.state.name') {
          for (const stateName of Object.keys(s.counts)) {
            const key = stateName.toLowerCase();

            if (!stateColorCache[key] && !unresolvedStates.has(key)) {
              unresolvedStates.set(key, { originalName: stateName, type: entry.type });
            }
          }
        }
      }
    }

    if (unresolvedStates.size === 0) {
      return;
    }

    const newColors: Record<string, StateColor> = {};
    const pending = Array.from(unresolvedStates.entries());
    const concurrency = 10;

    for (let i = 0; i < pending.length; i += concurrency) {
      const batch = pending.slice(i, i + concurrency);

      await Promise.all(batch.map(async([stateKey, { originalName, type }]) => {
        try {
          const schema = store.getters['cluster/schemaFor'](type);
          const params = stevePaginationUtils.createParamsForPagination({
            schema,
            opt: {
              pagination: {
                page:                 1,
                pageSize:             1,
                sort:                 [],
                filters:              [PaginationParamFilter.createSingleField({ field: 'metadata.state.name', value: originalName })],
                projectsOrNamespaces: [],
              }
            }
          });
          const url = `${ schema.links.collection }?${ params }`;
          const res = await store.dispatch('cluster/request', { url });
          const resource = res?.data?.[0];

          if (!resource?.metadata?.state) {
            return;
          }

          const { error: isError, transitioning, name } = resource.metadata.state;
          const rawColor = colorForState(name, isError, transitioning).replace('text-', '');

          newColors[stateKey] = (rawColor === 'darker' ? 'disabled' : rawColor) as StateColor;
        } catch {
          // Fallback handled by toStateColor via STATES lookup
        }
      }));
    }

    if (Object.keys(newColors).length > 0) {
      Object.assign(stateColorCache, newColors);
    }
  }

  // ── Fetching & polling ──

  async function fetchSummaries(): Promise<void> {
    try {
      const accessibleTypes = WORKLOAD_RESOURCE_TYPES.filter(
        (type) => store.getters['cluster/canList'](type)
      );

      const workloadPromises = accessibleTypes.map(async(type): Promise<WorkloadDashboardSummaryEntry> => {
        const schema = store.getters['cluster/schemaFor'](type);

        try {
          let url = `${ schema.links.collection }?summary=metadata.state.name`;

          if (namespaceFilterParam.value) {
            url += `&${ namespaceFilterParam.value }`;
          }

          const res = await store.dispatch('cluster/request', { url });

          return {
            type, summary: res.summary || [], error: null
          };
        } catch (e: any) {
          return {
            type, summary: null, error: e.message || t('workloadDashboard.errors.fetchType', { type })
          };
        }
      });

      const results = await Promise.all(workloadPromises);

      await resolveStateColors(results);
      summaries.value = results;
      fetchError.value = null;
    } catch (e: any) {
      fetchError.value = e.message || t('workloadDashboard.errors.fetchAll');
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
    resetNamespaceFilter,
    resourceRoute,
  };
}
