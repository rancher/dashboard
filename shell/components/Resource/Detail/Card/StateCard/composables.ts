import { Count, Props as ResourceRowProps } from '@shell/components/Resource/Detail/ResourceRow.types';
import { useI18n } from '@shell/composables/useI18n';
import { INGRESS, SERVICE } from '@shell/config/types';
import { isHigherAlert, StateColor } from '@shell/utils/style';
import {
  computed, onScopeDispose, ref, Ref, toValue, watch
} from 'vue';
import { useStore } from 'vuex';
import { Props as StateCardProps } from '@shell/components/Resource/Detail/Card/StateCard/types';
import { RouteLocationRaw } from 'vue-router';
import { simpleColorForState, stateDisplay as stateDisplayFn } from '@shell/plugins/dashboard-store/resource-class';
import { PaginationParamFilter } from '@shell/types/store/pagination.types';

export interface SummaryResult {
  count: number;
  summary: { property: string; counts: Record<string, number> }[] | null;
}

export function useResourceCardRow(label: string, resources: any[], stateColorKey = 'stateSimpleColor', stateDisplayKey = 'stateDisplay', to?: RouteLocationRaw): ResourceRowProps {
  const agg: any = {};

  resources.forEach((r: any) => {
    const state = r[stateDisplayKey]?.toLowerCase();
    const color = r[stateColorKey] || 'disabled';

    agg[state] = agg[state] || {
      color, label: state, count: 0
    };
    agg[state].count++;
  });

  interface Tuple extends Count {
    color: StateColor;
  }
  const tuples: Tuple[] = Object.values(agg);

  tuples.sort((left: any, right: any) => {
    if (isHigherAlert(left.color, right.color)) {
      return -1;
    }

    if (left.color !== right.color) {
      return 1;
    }

    if (left.count === right.count) {
      return 0;
    }

    return left.count > right.count ? -1 : 1;
  });

  return {
    label,
    color:  tuples.length ? tuples[0].color : undefined,
    counts: tuples.length ? tuples : undefined,
    to
  };
}

/**
 * Builds a ResourceRowProps from summary API response data.
 * The summary API returns state counts as { property: 'metadata.state.name', counts: { running: 2, error: 1 } }.
 * This maps those state names to display labels and colors using the same logic as resource models.
 */
export function useResourceCardRowFromSummary(label: string, summaryResult: SummaryResult | null | undefined, to?: RouteLocationRaw): ResourceRowProps {
  if (!summaryResult?.summary?.length) {
    return {
      label,
      color:  undefined,
      counts: undefined,
      to
    };
  }

  const stateSummary = summaryResult.summary.find((s) => s.property === 'metadata.state.name');

  if (!stateSummary?.counts) {
    return {
      label,
      color:  undefined,
      counts: summaryResult.count ? [{ label: '', count: summaryResult.count }] : undefined,
      to
    };
  }

  interface Tuple extends Count {
    color: StateColor;
  }

  const tuples: Tuple[] = Object.entries(stateSummary.counts).map(([state, count]) => {
    const color = simpleColorForState(state) as StateColor;
    const display = stateDisplayFn(state) as string;

    return {
      color,
      label: display?.toLowerCase() || state,
      count
    };
  });

  tuples.sort((left: Tuple, right: Tuple) => {
    if (isHigherAlert(left.color, right.color)) {
      return -1;
    }

    if (left.color !== right.color) {
      return 1;
    }

    if (left.count === right.count) {
      return 0;
    }

    return left.count > right.count ? -1 : 1;
  });

  return {
    label,
    color:  tuples.length ? tuples[0].color : undefined,
    counts: tuples.length ? tuples : undefined,
    to
  };
}

/**
 * Builds a ResourceRowProps from relationship state data.
 * Each relationship entry includes a `state` field (e.g. "active", "error").
 */
export function useResourceCardRowFromRelationships(label: string, relationships: any[], to?: RouteLocationRaw): ResourceRowProps {
  if (!relationships.length) {
    return {
      label, color: undefined, counts: undefined, to
    };
  }

  const agg: Record<string, { color: StateColor; label: string; count: number }> = {};

  relationships.forEach((r: any) => {
    const state = (r.state || 'missing').toLowerCase();
    const color = simpleColorForState(state) as StateColor;
    const display = (stateDisplayFn(state) as string)?.toLowerCase() || state;

    agg[state] = agg[state] || {
      color, label: display, count: 0
    };
    agg[state].count++;
  });

  interface Tuple extends Count {
    color: StateColor;
  }
  const tuples: Tuple[] = Object.values(agg);

  tuples.sort((left: Tuple, right: Tuple) => {
    if (isHigherAlert(left.color, right.color)) {
      return -1;
    }

    if (left.color !== right.color) {
      return 1;
    }

    if (left.count === right.count) {
      return 0;
    }

    return left.count > right.count ? -1 : 1;
  });

  return {
    label,
    color:  tuples.length ? tuples[0].color : undefined,
    counts: tuples.length ? tuples : undefined,
    to
  };
}

export interface Pairs {
    label: string;
    to?: RouteLocationRaw;
    resources: any[];
}

export function useDefaultResources(pairs: Ref<Pairs[]>) {
  const rows = computed(() => toValue(pairs).map(({ label, resources, to }) => useResourceCardRow(label, resources, undefined, undefined, to)));

  return rows;
}

export function useResourcePair(label: string, type: string, resources?: any[]) {
  const store = useStore();

  return computed(() => {
    if (!resources) {
      return undefined;
    }

    const resourcesValue = toValue(resources);

    return {
      label,
      resources: resourcesValue,
      to:        (resourcesValue?.length > 0) ? {
        name:   'c-cluster-product-resource',
        params: {
          cluster:  store.getters.currentCluster.id,
          product:  store.getters.currentProduct.name,
          resource: type
        }
      } : undefined,
    };
  });
}

export function useDefaultWorkloadResources(services?: any[], ingresses?: any[], referredToBy?: any[], refersTo?: any[]): StateCardProps {
  const store = useStore();
  const i18n = useI18n(store);

  const pairs: Ref<(Pairs | undefined)[]> = computed(() => [
    useResourcePair(i18n.t('component.resource.detail.card.resourcesCard.rows.services'), SERVICE, services).value,
    useResourcePair(i18n.t('component.resource.detail.card.resourcesCard.rows.ingresses'), INGRESS, ingresses).value,
    referredToBy ? {
      label:     i18n.t('component.resource.detail.card.resourcesCard.rows.referredToBy'),
      resources: toValue(referredToBy || []),
      to:        { hash: '#related' }
    } : undefined,
    refersTo ? {
      label:     i18n.t('component.resource.detail.card.resourcesCard.rows.refersTo'),
      resources: toValue(refersTo || []),
      to:        { hash: '#related' }
    } : undefined
  ]);

  const remainingPairs = computed(() => pairs.value.filter((p: (Pairs | undefined)): p is Pairs => p !== undefined));

  const rows = useDefaultResources(remainingPairs);

  return {
    title: i18n.t('component.resource.detail.card.resourcesCard.title'),
    rows:  rows.value
  };
}

export function useDefaultWorkloadInsightsCardProps(): StateCardProps {
  const store = useStore();
  const i18n = useI18n(store);

  const rows: ResourceRowProps[] = [
    {
      label:  i18n.t('component.resource.detail.card.insightsCard.rows.conditions'),
      to:     '#conditions',
      color:  'disabled',
      counts: [{ label: 'Available', count: 1 }, { label: 'Progressing', count: 1 }]
    },
    {
      label:  i18n.t('component.resource.detail.card.insightsCard.rows.events'),
      to:     '#events',
      color:  'disabled',
      counts: [{ label: 'Normal', count: 2 }]
    }
  ];

  return {
    title: i18n.t('component.resource.detail.card.insightsCard.title'),
    rows
  };
}

export interface ResourceSummaryOpt {
  summaryField: string;
  namespace?: string;
  filters?: PaginationParamFilter[];
}

/**
 * Composable that fetches a resource summary and keeps it updated by watching for resource changes.
 * Automatically stops watching when the component is unmounted or the scope is disposed.
 *
 * Must be called during component setup.
 */
export function useResourceSummary(type: string, opt: ResourceSummaryOpt) {
  const store = useStore();
  const count = ref(0);
  const summary = ref<SummaryResult['summary']>(null);

  const normalizedType = store.getters['cluster/normalizeType']?.(type) || type;
  let fetchId = 0;

  async function fetch() {
    const id = ++fetchId;

    try {
      const result = await store.dispatch('cluster/fetchResourceSummary', { type: normalizedType, opt });

      if (id !== fetchId) {
        return;
      }

      if (result) {
        count.value = result.count;
        summary.value = result.summary;
      }
    } catch (e) {
      console.warn(`useResourceSummary: fetch failed for type "${ type }"`, e); // eslint-disable-line no-console
    }
  }

  fetch();

  const stopWatch = watch(
    () => store.getters['cluster/generation']?.(normalizedType),
    () => fetch()
  );

  onScopeDispose(stopWatch);

  return { count, summary };
}
