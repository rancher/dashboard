import type { RouteLocationRaw } from 'vue-router';
import type { StateColor } from '@shell/utils/style';
import { stateDisplay } from '@shell/plugins/dashboard-store/resource-class';
import type { StatusSummaryCardItem } from '@shell/components/Resource/Detail/Card/StatusSummaryCard/types';

/**
 * Severity order of state colors, most severe first
 */
export const STATE_COLOR_ORDER: Record<string, number> = {
  error: 0, warning: 1, disabled: 2, info: 3, success: 4
};

export function compareStateColors(a: string, b: string): number {
  return (STATE_COLOR_ORDER[a] ?? 5) - (STATE_COLOR_ORDER[b] ?? 5);
}

export interface StatusSummaryState {
  name: string;
  count: number;
  color: StateColor;
}

export interface BuildStatusSummaryCardOptions {
  key: string;
  title: string;
  to?: RouteLocationRaw;
  states: StatusSummaryState[];
  /**
   * Route for a single state row. Rows are plain text when not given
   */
  stateRoute?: (name: string) => RouteLocationRaw;
  /**
   * Order of states that share a color. States not listed come after the listed ones. When not
   * given, states that share a color keep their input order
   */
  stateOrder?: string[];
}

function indexIn(order: string[], name: string): number {
  const i = order.indexOf(name);

  return i === -1 ? order.length : i;
}

/**
 * Build the props of a StatusSummaryCard from a list of state counts.
 *
 * Rows are sorted by severity, the status bar segments are grouped by color.
 */
export function buildStatusSummaryCard({
  key, title, to, states, stateRoute, stateOrder = []
}: BuildStatusSummaryCardOptions): StatusSummaryCardItem {
  const sorted = [...states].sort((a, b) => compareStateColors(a.color, b.color) || indexIn(stateOrder, a.name) - indexIn(stateOrder, b.name));
  const total = sorted.reduce((sum, s) => sum + s.count, 0);
  const byColor: Partial<Record<StateColor, number>> = {};

  for (const s of sorted) {
    byColor[s.color] = (byColor[s.color] || 0) + s.count;
  }

  const card: StatusSummaryCardItem = {
    key,
    title,
    total,
    segments: total ? Object.entries(byColor).map(([color, count]) => ({
      color:   color as StateColor,
      percent: ((count as number) / total) * 100,
    })) : [],
    rows: sorted.map((s) => ({
      label: stateDisplay(s.name, true),
      color: s.color,
      count: s.count,
      ...(stateRoute ? { to: stateRoute(s.name) } : {}),
    })),
  };

  if (to) {
    card.to = to;
  }

  return card;
}
