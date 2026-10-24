// STATUS CARDS — counts of a cluster's resources, cut into cards and rows any way that answers a
// question: "is anything wrong", "which namespaces have the most failing pods", "what are the
// biggest resources here".
//
// Everything a card shows comes down to one list of COUNTS: how many of a type are in one state in
// one namespace. A card is one slice of those counts (all of them, one type, or one namespace) and
// its rows are another (each state, each type, or each namespace). So the same few settings give a
// Pods-by-status card, a card per namespace listing its workloads, or a top-10 list.
//
// Pure functions - no Vue, no store. The widget fetches the counts and draws the cards with the
// dashboard's own StatusSummaryCard and StatusBreakdownCard.

import type { StateColor } from '@shell/utils/style';

/** What a card or a row is one of. */
export type StatusDimension = 'state' | 'type' | 'namespace';

/** What a widget's cards are: one card for everything, or one per type, or one per namespace. */
export type StatusCardsBy = 'none' | 'type' | 'namespace';

/** Which counts are counted: all of them, only those in an error state, or in an error or warning state. */
export type StatusOnly = 'all' | 'error' | 'warning';

/** How rows are coloured: by Rancher's own state colours, not at all, or by the widget's own map. */
export type StatusColors = 'state' | 'none' | 'custom';

export interface StatusCardsConfig {
  /** The types counted. None means every type the cluster counts. */
  resources: string[];
  /** Only this namespace; '' for all of them. */
  namespace: string;
  cards: StatusCardsBy;
  rows: StatusDimension;
  only: StatusOnly;
  sort: 'count' | 'name';
  /** Rows per card; 0 for all of them. */
  top: number;
  /** Cards; 0 for all of them. */
  maxCards: number;
  colors: StatusColors;
  /** With `colors: 'custom'`: a colour per state name. A state left out has none. */
  customColors: Record<string, StateColor>;
}

export const STATE_COLORS: StateColor[] = ['success', 'info', 'warning', 'error', 'disabled'];

export const DEFAULT_STATUS_CARDS: StatusCardsConfig = {
  resources:    ['pod'],
  namespace:    '',
  cards:        'type',
  rows:         'state',
  only:         'all',
  sort:         'count',
  top:          0,
  maxCards:     0,
  colors:       'state',
  customColors: {},
};

const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const oneOf = <T extends string>(value: unknown, allowed: readonly T[], fallback: T): T => (allowed.includes(value as T) ? value as T : fallback);
const count = (value: unknown): number => {
  const n = Math.round(Number(value));

  return Number.isFinite(n) && n > 0 ? n : 0;
};

/**
 * A status widget's settings, as stored - every field is checked, since a view is a ConfigMap
 * anyone with access can edit, and Liz writes them too.
 */
export function normalizeStatusCards(value: unknown): StatusCardsConfig {
  const v = isObject(value) ? value : {};
  const resources = (Array.isArray(v.resources) ? v.resources : typeof v.resources === 'string' ? v.resources.split(',') : DEFAULT_STATUS_CARDS.resources)
    .map((r) => `${ r }`.trim()).filter(Boolean);
  const customColors: Record<string, StateColor> = {};

  if (isObject(v.customColors)) {
    for (const [state, color] of Object.entries(v.customColors)) {
      if (STATE_COLORS.includes(color as StateColor) && state.trim()) {
        customColors[state.trim().toLowerCase()] = color as StateColor;
      }
    }
  }

  return {
    resources,
    namespace: typeof v.namespace === 'string' ? v.namespace.trim() : '',
    cards:     oneOf(v.cards, ['none', 'type', 'namespace'] as const, DEFAULT_STATUS_CARDS.cards),
    rows:      oneOf(v.rows, ['state', 'type', 'namespace'] as const, DEFAULT_STATUS_CARDS.rows),
    only:      oneOf(v.only, ['all', 'error', 'warning'] as const, 'all'),
    sort:      oneOf(v.sort, ['count', 'name'] as const, 'count'),
    top:       count(v.top),
    maxCards:  count(v.maxCards),
    colors:    oneOf(v.colors, ['state', 'none', 'custom'] as const, 'state'),
    customColors,
  };
}

// ---- the counts ---------------------------------------------------------------------------------

/** How many of a type are in one state in one namespace ('' for a type that has no namespaces). */
export interface StatusCount {
  type: string;
  namespace: string;
  state: string;
  count: number;
}

/** A state summary of one type, as the cluster's API returns it (see fetchStateSummaries). */
export interface TypeStateSummary {
  type: string;
  summary: { property: string; counts: Record<string, { total: number; namespace?: Record<string, number> }> }[] | null;
  error?: string | null;
}

/** Per-type state summaries, as counts: each state of each type, in each namespace. */
export function countsFromSummaries(summaries: TypeStateSummary[]): StatusCount[] {
  const out: StatusCount[] = [];

  for (const s of summaries) {
    const byState = (s.error ? [] : s.summary || []).find((p) => p.property === 'metadata.state.name')?.counts || {};

    for (const [state, detail] of Object.entries(byState)) {
      const namespaces = Object.entries(detail.namespace || {});

      if (namespaces.length) {
        namespaces.forEach(([namespace, n]) => out.push({
          type: s.type, namespace, state, count: n
        }));
      } else {
        out.push({
          type: s.type, namespace: '', state, count: detail.total
        });
      }
    }
  }

  return out;
}

/** One type in a cluster's `counts`: a total, the states that need attention, and the same per namespace. */
interface CountsEntry {
  summary?: { count?: number; states?: Record<string, number> };
  namespaces?: Record<string, { count?: number; states?: Record<string, number> }>;
}

/** What a resource in none of the states `counts` lists is - not in trouble, and not moving. */
export const COUNTS_OTHER_STATE = 'active';

/**
 * A cluster's `counts` - every type it serves, in one request - as counts.
 *
 * `counts` only names the states that need attention (error, in-progress…); the rest of a type is
 * counted as `active`. Coarser than a state summary, but it covers every type at once, which is what
 * a "top resources" card needs.
 */
export function countsFromClusterCounts(counts: Record<string, CountsEntry> | null, types: string[] = []): StatusCount[] {
  const out: StatusCount[] = [];
  const wanted = types.length ? types.filter((t) => counts?.[t]) : Object.keys(counts || {});

  for (const type of wanted) {
    const entry = counts?.[type] || {};
    const namespaces = Object.entries(entry.namespaces || {});
    const parts: [string, { count?: number; states?: Record<string, number> }][] = namespaces.length ? namespaces : [['', entry.summary || {}]];

    for (const [namespace, part] of parts) {
      let flagged = 0;

      for (const [state, n] of Object.entries(part.states || {})) {
        flagged += n;
        out.push({
          type, namespace, state, count: n
        });
      }

      const rest = (part.count || 0) - flagged;

      if (rest > 0) {
        out.push({
          type, namespace, state: COUNTS_OTHER_STATE, count: rest
        });
      }
    }
  }

  return out;
}

// ---- the cards ----------------------------------------------------------------------------------

/** One count on a row: how many, in which colour, from which states. */
export interface StatusCell {
  color: StateColor | null;
  count: number;
  states: string[];
}

export interface StatusRow {
  /** The state, type or namespace the row is. */
  key: string;
  dimension: StatusDimension;
  total: number;
  /** By colour, most severe first - one cell when the widget has no colours. */
  cells: StatusCell[];
  /** The colour a state row draws in; null without colours. */
  color: StateColor | null;
}

export interface StatusCardData {
  /** The type or namespace the card is; '' for the one card of a widget with no split. */
  key: string;
  dimension: StatusCardsBy;
  total: number;
  rows: StatusRow[];
}

/** How a state is judged (always Rancher's colours) and drawn (the widget's choice). */
export interface StatusColoring {
  /** Rancher's own colour for a state of a type - used to decide what counts as an error. */
  stateColor: (state: string, type: string) => StateColor;
}

const SEVERITY: Record<string, number> = {
  error: 0, warning: 1, disabled: 2, info: 3, success: 4
};

/** The colour a state is drawn in, by the widget's setting: Rancher's, its own map, or none. */
export function drawnColor(config: StatusCardsConfig, rancherColor: StateColor, state: string): StateColor | null {
  if (config.colors === 'none') {
    return null;
  }
  if (config.colors === 'custom') {
    return config.customColors[state.toLowerCase()] || null;
  }

  return rancherColor;
}

function keep(config: StatusCardsConfig, color: StateColor): boolean {
  if (config.only === 'error') {
    return color === 'error';
  }
  if (config.only === 'warning') {
    return color === 'error' || color === 'warning';
  }

  return true;
}

const dimensionOf = (c: StatusCount, dimension: StatusDimension | 'none'): string => (dimension === 'none' ? '' : c[dimension]);

/**
 * The cards: the counts filtered (namespace, `only`), split into cards and each card into rows,
 * sorted and cut to the widget's tops.
 *
 * A split by namespace leaves out what has no namespace (cluster-scoped types), which belongs to no
 * namespace card or row. Empty rows and cards are dropped: a card says what there is.
 */
export function buildStatusCards(counts: StatusCount[], config: StatusCardsConfig, coloring: StatusColoring): StatusCardData[] {
  const usesNamespace = config.cards === 'namespace' || config.rows === 'namespace';
  const kept = counts.filter((c) => c.count > 0 &&
    (!config.namespace || c.namespace === config.namespace) &&
    (!usesNamespace || c.namespace) &&
    keep(config, coloring.stateColor(c.state, c.type)));

  const cards = new Map<string, StatusCount[]>();

  for (const c of kept) {
    const key = dimensionOf(c, config.cards);

    cards.set(key, [...(cards.get(key) || []), c]);
  }

  const byName = (a: { key: string }, b: { key: string }) => a.key.localeCompare(b.key);
  const byCount = (a: { key: string, total: number }, b: { key: string, total: number }) => b.total - a.total || byName(a, b);

  const built = [...cards.entries()].map(([key, list]): StatusCardData => {
    const rows = new Map<string, StatusCount[]>();

    for (const c of list) {
      rows.set(c[config.rows], [...(rows.get(c[config.rows]) || []), c]);
    }

    const allRows = [...rows.entries()].map(([rowKey, cells]): StatusRow => {
      const byColor = new Map<string, StatusCell>();

      for (const c of cells) {
        const color = drawnColor(config, coloring.stateColor(c.state, c.type), c.state);
        const cell = byColor.get(color || '') || {
          color, count: 0, states: []
        };

        cell.count += c.count;
        if (!cell.states.includes(c.state)) {
          cell.states.push(c.state);
        }
        byColor.set(color || '', cell);
      }

      const rowCells = [...byColor.values()].sort((a, b) => (SEVERITY[a.color || ''] ?? 5) - (SEVERITY[b.color || ''] ?? 5));

      return {
        key:       rowKey,
        dimension: config.rows,
        total:     rowCells.reduce((sum, cell) => sum + cell.count, 0),
        cells:     rowCells,
        color:     config.rows === 'state' ? rowCells[0]?.color ?? null : null,
      };
    });

    // A state row is ordered by severity first, as the dashboard's own cards are, unless the widget asks for names
    const stateSort = (a: StatusRow, b: StatusRow) => (SEVERITY[a.color || ''] ?? 5) - (SEVERITY[b.color || ''] ?? 5) || b.total - a.total || byName(a, b);
    const sorted = config.sort === 'name' ? allRows.sort(byName) : config.rows === 'state' && config.colors !== 'none' && !config.top ? allRows.sort(stateSort) : allRows.sort(byCount);
    const cut = config.top ? sorted.slice(0, config.top) : sorted;

    return {
      key, dimension: config.cards, total: cut.reduce((sum, r) => sum + r.total, 0), rows: cut
    };
  }).filter((card) => card.rows.length);

  const ordered = config.sort === 'name' ? built.sort(byName) : built.sort(byCount);

  return config.maxCards ? ordered.slice(0, config.maxCards) : ordered;
}
