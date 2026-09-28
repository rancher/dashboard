import { Count, Props as ResourceRowProps } from '@shell/components/Resource/Detail/ResourceRow.types';
import { isHigherAlert, StateColor } from '@shell/utils/style';
import { RouteLocationRaw } from 'vue-router';
import { simpleColorForState, stateDisplay as stateDisplayFn, STATES_ENUM } from '@shell/plugins/dashboard-store/resource-class';

interface Tuple extends Count {
  color: StateColor;
}

export interface SummaryCountValue {
  total: number;
  namespace?: Record<string, number>;
}

export interface SummaryEntry {
  property: string;
  counts: Record<string, SummaryCountValue>;
}

export interface SummaryResult {
  count: number;
  summary: SummaryEntry[] | null;
}

export function useResourceCardRow(label: string, resources: any[], stateColorKey = 'stateSimpleColor', stateDisplayKey = 'stateDisplay', to?: RouteLocationRaw): ResourceRowProps {
  const agg: any = {};

  resources.forEach((r: any) => {
    const state = r[stateDisplayKey]?.toLowerCase();
    const color = r[stateColorKey] || 'disabled';

    agg[state] = agg[state] || {
      color, label: state, count: 0
    };

    if (isHigherAlert(color, agg[state].color)) {
      agg[state].color = color;
    }

    agg[state].count++;
  });

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

/**
 * Builds a ResourceRowProps from relationship state data.
 *
 * Each relationship entry carries a `state` field (e.g. "active", "error")
 * plus the `error` and `transitioning` flags, and its color is resolved from
 * all three the same way `Resource.stateSimpleColor` resolves a resource's.
 */
export function useResourceCardRowFromRelationships(label: string, relationships: any[], to?: RouteLocationRaw): ResourceRowProps {
  const resources = relationships.map((r: any) => {
    const state = r.state || STATES_ENUM.MISSING;

    return {
      stateDisplay:     stateDisplayFn(state),
      stateSimpleColor: simpleColorForState(state, r.error, r.transitioning),
    };
  });

  return useResourceCardRow(label, resources, 'stateSimpleColor', 'stateDisplay', to);
}
