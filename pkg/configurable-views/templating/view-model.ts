// The model behind the configurable pages.
//
// Vocabulary (used consistently in the code, the UI and the stored ConfigMap):
//
//   PAGE     the Home, or a cluster's dashboard. Holds one or more VIEWS; with more than one, they
//            are tabs in the bar at the top.
//   VIEW     one named arrangement of the page. A LAYOUT view is a flat list of WIDGETS; a STOCK
//            view has no list at all and renders the page Rancher already had, so Rancher's own
//            page is always one of the tabs.
//   WIDGET   one building block on a view's grid — a table, a cluster's capacity, a row of links —
//            sized by a COLUMN SPAN (1…12) and configured through its own settings.
//
// There are NO rows. A view's widgets are one flat, ordered list, and they WRAP: a widget starts a
// new line when there is no room left on the current one, exactly as a paragraph wraps words. Rows
// used to be explicit nodes you could select and pad; they are gone, because a row was structure
// pretending to be a thing you configure. Spacing now lives in the two places that own it — per
// widget (its own margin and padding) and per view (the gap between every widget).
//
// Pure functions — no Vue, no store. Everything that reads STORED data takes `unknown` and checks
// what it gets: a view round-trips through a ConfigMap anyone with access can edit by hand.

import {
  NODE_WIDGET, type LayoutView, type View, type Sides, type StockView, type ViewSet, type WidgetKind,
  type WidgetNode, type WidgetPlace, type WidgetSpec, type WidgetTab, type MetricsDashboard
} from './types';

export { NODE_WIDGET };

/** The widget that holds other widgets, in tabs. */
const TABS_KIND = 'tabs';

/** The widget that shows one of the cluster dashboard's Grafana dashboards, and which ones it can. */
const METRICS_KIND = 'clusterMetrics';
const METRICS_DASHBOARDS = ['cluster', 'k8s', 'etcd'];

/** What a stock view says it is. See isStockView. */
const STOCK_KIND = 'stock';

/** Widgets are laid out on this many columns. */
export const GRID_COLUMNS = 12;

/** Default column span for a newly dropped widget (half a line). */
const DEFAULT_COL_SPAN = 6;

/** The gap between widgets. One value for the whole VIEW, not something per widget. */
export const DEFAULT_GAP = 20;

/** The space between the grid and the edges of the page. Also one value for the whole VIEW. */
export const DEFAULT_PAGE_PADDING = 20;

/** One grid row. `2 rows` is two of these plus the gap between them. */
const ROW_HEIGHT = 156;

/** A stored size: a number of px, or any CSS length ('auto', '240px', '30%'). */
export type Size = number | string;

export interface WidthPreset { id: string; label: string; span: number }
export interface HeightPreset { id: string; label: string; rows: number }
export interface SpacingPreset { id: string; label: string; padding: number }

/**
 * WIDTH is chosen from four presets rather than 12 free columns — the four that read well on a
 * dashboard. `Advanced → Column span` still exposes the raw twelfths underneath.
 */
export const WIDTH_PRESETS: WidthPreset[] = [
  {
    id: 'third', label: '1/3', span: 4
  },
  {
    id: 'half', label: '1/2', span: 6
  },
  {
    id: 'twoThirds', label: '2/3', span: 8
  },
  {
    id: 'full', label: 'Full', span: GRID_COLUMNS
  },
];

/** The raw column spans offered under Advanced. */
export const COLUMN_SPANS = [4, 6, 8, 12];

/** HEIGHT presets: fit the content, or a fixed number of grid rows. */
export const HEIGHT_PRESETS: HeightPreset[] = [
  {
    id: 'fit', label: 'Fit content', rows: 0
  },
  {
    id: 'rows2', label: '2 rows', rows: 2
  },
  {
    id: 'rows3', label: '3 rows', rows: 3
  },
];

/**
 * SPACING presets set the padding INSIDE a widget — how much room its content has within its own
 * card. That is the ordinary meaning of padding, and it leaves MARGIN (under Advanced) free to mean
 * the ordinary thing too: space OUTSIDE the widget, on top of the view's gap.
 *
 * Compact is ZERO, so content runs to the card's edge. Default is 16, which is the design's card.
 * Advanced overrides all three with exact pixels.
 */
export const SPACING_PRESETS: SpacingPreset[] = [
  {
    id: 'compact', label: 'Compact', padding: 0
  },
  {
    id: 'default', label: 'Default', padding: 16
  },
  {
    id: 'spacious', label: 'Spacious', padding: 24
  },
];

// ---- reading stored values ------------------------------------------------------------------------

type Loose = Record<string, unknown>;

function isObject(v: unknown): v is Loose {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}

function arr(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}

function strings(v: unknown): string[] {
  return arr(v).filter((x): x is string => typeof x === 'string');
}

function num(v: unknown, fallback: number): number {
  return Number.isFinite(Number(v)) ? Number(v) : fallback;
}

// ---- ids ------------------------------------------------------------------------------------------

let idSeq = 0;

/**
 * A fresh id. Exported because the editor also mints ids (forking a view, duplicating one) and two
 * of those in the same millisecond must not collide — which is exactly what a hand-rolled
 * `Date.now()` id does.
 */
export function newId(prefix = 'id'): string {
  idSeq += 1;

  return `${ prefix }-${ Date.now().toString(36) }${ idSeq.toString(36) }`;
}

// ---- value normalization ------------------------------------------------------------------------

/** Clamp a column span into 1..12. */
export function clampSpan(span: unknown): number {
  const n = Math.round(Number(span));

  if (!n || Number.isNaN(n)) {
    return DEFAULT_COL_SPAN;
  }

  return Math.max(1, Math.min(GRID_COLUMNS, n));
}

/** A size is a number (px) or a CSS length string ('auto', '240px', '30%'). */
function normalizeSize(value: unknown, fallback: Size = 'auto'): Size {
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }

  return fallback;
}

/** Turn a stored size into a CSS value (240 -> '240px', '100%' -> '100%'). */
export function cssSize(value: Size): string {
  return typeof value === 'number' ? `${ value }px` : `${ value }`;
}

/**
 * Normalize a four-sided box value (margin or padding) — each side a number (px) or a CSS length
 * string ('5%', '2rem').
 */
export function normalizeSides(sides: unknown): Sides {
  const p = isObject(sides) ? sides : {};
  const side = (v: unknown): Size => normalizeSize(v, 0);

  return {
    top:    side(p.top),
    right:  side(p.right),
    bottom: side(p.bottom),
    left:   side(p.left),
  };
}

/** Build a CSS `margin`/`padding` shorthand for a four-sided box value. */
export function cssSides(sides: unknown): string {
  const p = normalizeSides(sides);

  return [p.top, p.right, p.bottom, p.left].map(cssSize).join(' ');
}

// ---- presets ------------------------------------------------------------------------------------

/** The width preset a column span corresponds to (null when it matches none of them). */
export function widthPresetOf(span: unknown): string | null {
  return WIDTH_PRESETS.find((p) => p.span === clampSpan(span))?.id || null;
}

/** Height in px for N grid rows, including the gaps they span. */
function rowsHeight(rows: number, gap = DEFAULT_GAP): number {
  return (rows * ROW_HEIGHT) + ((rows - 1) * gap);
}

/** The height preset a stored height corresponds to ('fit' for auto / anything unrecognized). */
export function heightPresetOf(height: Size, gap = DEFAULT_GAP): string {
  return HEIGHT_PRESETS.find((p) => p.rows && height === rowsHeight(p.rows, gap))?.id || 'fit';
}

/** The stored height for a height preset id. */
export function heightForPreset(id: string, gap = DEFAULT_GAP): Size {
  const preset = HEIGHT_PRESETS.find((p) => p.id === id);

  return preset?.rows ? rowsHeight(preset.rows, gap) : 'auto';
}

/** The spacing preset a widget's padding corresponds to (null once Advanced has overridden it). */
export function spacingPresetOf(padding: unknown): string | null {
  const p = normalizeSides(padding);
  const same = p.top === p.right && p.right === p.bottom && p.bottom === p.left;

  return (same && SPACING_PRESETS.find((s) => s.padding === p.top)?.id) || null;
}

// ---- widgets ------------------------------------------------------------------------------------

/**
 * Normalize a WIDGET spec — the declarative description of what one widget shows. Every field is
 * optional; a widget with only a `kind` renders its own sensible default.
 *
 *   kind        which building block: table | links | banner | clusterTable | overview |
 *               clusterHeader | resourceCards | clusterCapacity | clusterEvents |
 *               clusterCertificates | clusterComponentStatus | clusterAlerts | clusterMetrics |
 *               clusterExtensionCards | tabs
 *   title       heading shown on the widget
 *   resource    the Rancher/Kubernetes type it reads (any kind Rancher knows, including CRDs)
 *   where       'view'   — the same clusters the view covers
 *               'custom' — only the clusters/namespaces in `targets`
 *   filter      a labels-or-fields expression: `env=prod`, `state != Active`
 *   cluster     the cluster it shows; '' follows the page (see useWidgetCluster)
 *   columns     table columns to show, in order
 *   sortBy      field to sort on, `sortDir` 'asc' | 'desc'
 *   limit       how many rows a table shows per page
 *   source      'home' — Rancher's own links | 'custom' — the `links` below (links widget)
 *   links       [{ label, url }] (links widget)
 *   metrics     'cluster' | 'k8s' | 'etcd' (metrics widget)
 *   tabs        [{ id, name, widgets }] (tabs widget) - each tab's widgets are normalized like a view's
 */
export function normalizeWidget(widget: unknown): WidgetSpec {
  const w = isObject(widget) ? widget : {};
  const limit = Number(w.limit);

  const out: WidgetSpec = {
    // A widget with no kind is malformed; it becomes the block every Home can show something with.
    // An unknown kind is kept as written, so the grid can say which block it does not have.
    kind:     str(w.kind, 'table') as WidgetKind,
    title:    str(w.title),
    resource: str(w.resource),
    where:    w.where === 'custom' ? 'custom' : 'view',
    source:   w.source === 'custom' ? 'custom' : 'home',
    targets:  strings(w.targets),
    // Which cluster it shows. One, because several clusters are several APIs and cannot be paged as
    // one list; '' follows the page's cluster (see useWidgetCluster).
    cluster:  str(w.cluster) || strings(w.clusters)[0] || '',
    filter:   str(w.filter),
    columns:  strings(w.columns),
    sortBy:   str(w.sortBy),
    sortDir:  w.sortDir === 'desc' ? 'desc' : 'asc',
    limit:    Number.isFinite(limit) && limit > 0 ? Math.round(limit) : 0,
    links:    arr(w.links).filter(isObject).map((l) => ({ label: str(l.label), url: str(l.url) })),
  };

  // `subtitle` and `image` are banner-only extras; keep them only when set so stored specs stay small.
  if (w.subtitle) {
    out.subtitle = str(w.subtitle);
  }
  if (w.image) {
    out.image = str(w.image);
  }
  if (out.kind === METRICS_KIND) {
    out.metrics = (METRICS_DASHBOARDS.includes(str(w.metrics)) ? str(w.metrics) : 'cluster') as MetricsDashboard;
  }
  if (out.kind === TABS_KIND) {
    out.tabs = normalizeTabs(w.tabs);
  }

  return out;
}

/** A Tabs widget's tabs. It always has at least one: a Tabs widget with none would have nowhere to drop into. */
function normalizeTabs(tabs: unknown): WidgetTab[] {
  const out = arr(tabs).filter(isObject).map((t, i) => ({
    // A tab's id only has to be unique within its widget; one made up here is kept from the next save on.
    id:      str(t.id) || newId('tab'),
    name:    str(t.name) || `Tab ${ i + 1 }`,
    widgets: arr(t.widgets).map(normalizeNode).filter((n): n is WidgetNode => !!n),
  }));

  return out.length ? out : [{
    id: newId('tab'), name: 'Tab 1', widgets: []
  }];
}

/** Where a new widget goes and how big it is. Every field is optional. */
export interface WidgetBoxOptions {
  id?: string;
  colSpan?: unknown;
  height?: unknown;
  margin?: unknown;
  padding?: unknown;
}

/** The box every widget on the grid carries: how wide, how tall, and its own spacing. */
function widgetBox(opts: WidgetBoxOptions, defaultSpan: number) {
  // 16 all round — the design's own card inset, which is what Default spacing means.
  const padding = opts.padding ?? {
    top: 16, right: 16, bottom: 16, left: 16
  };

  return {
    colSpan: clampSpan(opts.colSpan ?? defaultSpan),
    height:  normalizeSize(opts.height, 'auto'),
    margin:  normalizeSides(opts.margin),
    padding: normalizeSides(padding),
  };
}

/** A new WIDGET — one building block on the grid. `widget` is a spec, or just its kind. */
export function newWidgetNode(widget: unknown, opts: WidgetBoxOptions = {}): WidgetNode {
  return {
    id:     opts.id || newId('w'),
    type:   NODE_WIDGET,
    widget: normalizeWidget(typeof widget === 'string' ? { kind: widget } : widget),
    ...widgetBox(opts, DEFAULT_COL_SPAN),
  };
}

/**
 * Coerce one stored entry into a widget, or null when it is not one.
 *
 * A stored TEMPLATE node — the older kind, pointing at a template ConfigMap — returns null and is
 * dropped: templates are gone, and a view is widgets only.
 */
function normalizeNode(node: unknown): WidgetNode | null {
  if (!isObject(node)) {
    return null;
  }

  return node.type === NODE_WIDGET || (!node.type && node.widget) ? newWidgetNode(node.widget, node as WidgetBoxOptions) : null;
}

/**
 * Flatten anything a view might hold into one ordered list of widgets.
 *
 * Stored views used to be a TREE of organizers (rows, nestable) with widgets at the leaves. Rows are
 * gone, so a stored tree is read by walking it in order and keeping the leaves: the widgets come out
 * in the order they were drawn, and wrap into the same lines whenever their spans filled a row —
 * which is the case for every view built by the old editor. A row's own padding is dropped, because
 * there is no longer anything for it to belong to.
 */
function flattenWidgets(value: unknown): WidgetNode[] {
  const out: WidgetNode[] = [];
  const walk = (node: unknown): void => {
    if (!isObject(node)) {
      return;
    }

    const leaf = normalizeNode(node);

    if (leaf) {
      out.push(leaf);

      return;
    }

    arr(node.children).forEach(walk);
  };

  if (Array.isArray(value)) {
    value.forEach(walk);
  } else {
    walk(value);
  }

  return out;
}

// ---- views & views -----------------------------------------------------------------------------

/** What a new view can start with. */
export interface ViewOptions {
  id?: string;
  gap?: unknown;
  pad?: unknown;
  widgets?: WidgetNode[];
}

/** A new VIEW — one named VIEW in the tab strip. */
export function newLayoutView(name?: string, opts: ViewOptions = {}): LayoutView {
  return {
    id:      opts.id || newId('view'),
    name:    name || 'Untitled view',
    gap:     num(opts.gap, DEFAULT_GAP),
    pad:     num(opts.pad, DEFAULT_PAGE_PADDING),
    widgets: Array.isArray(opts.widgets) ? opts.widgets : [],
  };
}

/**
 * The id of the built-in STOCK view: Rancher's own page, offered as a tab on every configurable
 * page whether or not a stock view was ever saved (see builtInStockView).
 */
export const BUILT_IN_STOCK_ID = 'built-in-stock';

/**
 * Rancher's own page as a view, when nothing stored is one. Not saved anywhere - it is always there,
 * so it cannot be deleted, published or renamed, and a page with no stored views at all still shows
 * the page Rancher already had, as a tab.
 */
export function builtInStockView(name: string): StockView {
  return {
    id: BUILT_IN_STOCK_ID, name, kind: STOCK_KIND
  };
}

/** True when a view renders the stock Rancher home rather than a grid of widgets. */
export function isStockView(view: unknown): view is StockView {
  return isObject(view) && view.kind === STOCK_KIND;
}

function normalizeView(view: Loose): View {
  // A stock view carries no widgets — there is nothing to lay out.
  const out: View = isStockView(view) ? {
    id: str(view.id) || newId('view'), name: str(view.name) || 'Home', kind: STOCK_KIND
  } : {
    id:      str(view.id) || newId('view'),
    name:    str(view.name) || 'Untitled view',
    gap:     num(view.gap, DEFAULT_GAP),
    pad:     num(view.pad, DEFAULT_PAGE_PADDING),
    // `widgets` is the shape now; `organizer` is the tree this replaced.
    widgets: flattenWidgets(view.widgets ?? view.organizer),
  };

  // Published organization templates are marked so the UI can show (and protect) them.
  if (view.org) {
    out.org = true;
  }

  // Which published view this one was forked from. It MUST survive a round trip through storage,
  // or the fork and its source both show up in the bar as two views with the same name.
  if (view.from) {
    out.from = str(view.from);
  }

  return out;
}

/** A VIEW with nothing saved in it. The page still shows its stock tab (see builtInStockView). */
function emptyViewSet(): ViewSet {
  return { views: [] };
}

/**
 * Coerce ANY stored value into a valid VIEW SET:
 *   - the current shape          { views: [ { widgets } ] }
 *   - the same, as first named   { panels: [ { widgets } ], defaultPanelId }
 *   - the organizer-tree shape   { views: [ { organizer } ] }
 *   - the legacy dashboard shape { tabs:   [ { name } ] }
 *   - the legacy single name     "home"
 *
 * The two legacy shapes pointed at template ConfigMaps, which are gone; their tabs survive, empty.
 *
 * An empty list stays empty. It used to be replaced by a new view named "Home" - the old way of
 * making sure a page had a tab - which invented a view with a fresh id on every read, and named it
 * "Home" on pages that are not the Home. Every page now has its stock tab instead, stored or not.
 */
export function migrateViewSet(value: unknown): ViewSet {
  const finish = (views: View[], source: Loose | null): ViewSet => {
    const out: ViewSet = { views };
    const defaultId = str(source?.defaultViewId);

    // Which view opens first. Dropped when it names a view that no longer exists.
    if (defaultId && out.views.some((p) => p.id === defaultId)) {
      out.defaultViewId = defaultId;
    }

    if (source?.disabled) {
      out.disabled = true;
    }

    return out;
  };

  // Current shape - and the shape before views were called that, when the same list was stored as
  // `panels` with a `defaultPanelId`. Both keys are read, so nothing saved under the old names is
  // lost; the next save writes the new ones.
  const stored = isObject(value) ? (Array.isArray(value.views) ? value.views : value.panels) : undefined;

  if (isObject(value) && Array.isArray(stored)) {
    return finish(stored.filter(isObject).map(normalizeView), { ...value, defaultViewId: value.defaultViewId ?? value.defaultPanelId });
  }

  // Legacy: tabs[] of template grids. The grids named templates; only the tabs are left.
  if (isObject(value) && Array.isArray(value.tabs)) {
    return finish(value.tabs.filter(isObject).map((t) => newLayoutView(str(t.name), { id: str(t.id) || undefined })), value);
  }

  // Legacy: a single applied template name. The template is gone, so there is nothing to show.
  if (typeof value === 'string' && value) {
    return finish([], null);
  }

  return emptyViewSet();
}

// ---- list operations (used by the editor; all return NEW lists) ----------------------------------
//
// A view's widgets are a list, and a Tabs widget on it holds one more list per tab. Every operation
// below addresses a widget by its id wherever it is, so the editor never has to know which list a
// widget sits in - only a DROP says where something goes, as a WidgetPlace (null: the view's own list).

/** Apply `fn` to every list in the tree: the view's own, then each tab's of every Tabs widget in it. */
function eachList(widgets: WidgetNode[], fn: (list: WidgetNode[]) => WidgetNode[]): WidgetNode[] {
  return fn(widgets || []).map((w) => (w.widget.tabs ? {
    ...w,
    widget: { ...w.widget, tabs: w.widget.tabs.map((t) => ({ ...t, widgets: eachList(t.widgets, fn) })) },
  } : w));
}

/** Apply `fn` to the one list at `place`. */
function atPlace(widgets: WidgetNode[], place: WidgetPlace | null, fn: (list: WidgetNode[]) => WidgetNode[]): WidgetNode[] {
  if (!place) {
    return fn(widgets || []);
  }

  return updateWidget(widgets, place.parentId, (w) => ({
    ...w,
    widget: { ...w.widget, tabs: (w.widget.tabs || []).map((t) => (t.id === place.tabId ? { ...t, widgets: fn(t.widgets) } : t)) },
  }));
}

/** Find a widget by id, in the view or in any tab. */
export function findWidget(widgets: WidgetNode[] | null | undefined, id: string | null): WidgetNode | null {
  for (const w of widgets || []) {
    if (w.id === id) {
      return w;
    }
    for (const tab of w.widget.tabs || []) {
      const found = findWidget(tab.widgets, id);

      if (found) {
        return found;
      }
    }
  }

  return null;
}

/** Which list a widget is in: null for the view's own, its tab for one inside a Tabs widget, undefined when it is nowhere. */
export function placeOf(widgets: WidgetNode[] | null | undefined, id: string): WidgetPlace | null | undefined {
  for (const w of widgets || []) {
    if (w.id === id) {
      return null;
    }
    for (const tab of w.widget.tabs || []) {
      const found = placeOf(tab.widgets, id);

      if (found === null) {
        return { parentId: w.id, tabId: tab.id };
      }
      if (found) {
        return found;
      }
    }
  }

  return undefined;
}

/** Whether a widget of `kind` may go at `place`. Anything may go on the view; a tab takes anything but more tabs. */
export function canPlace(kind: string, place: WidgetPlace | null): boolean {
  return !place || kind !== TABS_KIND;
}

/** Whether `place` names a tab that is really there - a drop into one that is not would lose the widget. */
function placeExists(widgets: WidgetNode[], place: WidgetPlace | null): boolean {
  return !place || !!findWidget(widgets, place.parentId)?.widget.tabs?.some((t) => t.id === place.tabId);
}

function samePlace(a: WidgetPlace | null, b: WidgetPlace | null): boolean {
  return a === b || (!!a && !!b && a.parentId === b.parentId && a.tabId === b.tabId);
}

function insertAt(list: WidgetNode[], widget: WidgetNode, index?: number): WidgetNode[] {
  const out = [...list];
  const at = typeof index === 'number' ? Math.max(0, Math.min(out.length, index)) : out.length;

  out.splice(at, 0, widget);

  return out;
}

/** Insert a widget at `index` of the list at `place` (appends when the index is omitted or past the end). */
export function insertWidget(widgets: WidgetNode[], widget: WidgetNode, index?: number, place: WidgetPlace | null = null): WidgetNode[] {
  if (!canPlace(widget.widget.kind, place) || !placeExists(widgets, place)) {
    return [...(widgets || [])];
  }

  return atPlace(widgets, place, (list) => insertAt(list, widget, index));
}

/** Remove a widget by id, wherever it is. */
export function removeWidget(widgets: WidgetNode[], id: string): WidgetNode[] {
  return eachList(widgets, (list) => list.filter((w) => w.id !== id));
}

/** Move a widget one place earlier (-1) or later (+1) in its own list. */
export function moveWidget(widgets: WidgetNode[], id: string, delta: number): WidgetNode[] {
  return eachList(widgets, (list) => {
    const out = [...list];
    const from = out.findIndex((w) => w.id === id);
    const to = from + delta;

    if (from < 0 || to < 0 || to >= out.length) {
      return out;
    }

    const [moved] = out.splice(from, 1);

    out.splice(to, 0, moved);

    return out;
  });
}

/**
 * DRAG & DROP: move an existing widget to `index` of the list at `place` - its own list, or another
 * one (into a tab, out of one, from one tab to the next). Within its own list the index is corrected
 * for the gap the widget leaves behind, so dropping "just after myself" is a no-op rather than an
 * off-by-one.
 */
export function moveWidgetTo(widgets: WidgetNode[], id: string, index?: number, place: WidgetPlace | null = null): WidgetNode[] {
  const node = findWidget(widgets, id);
  const from = placeOf(widgets, id);

  if (!node || from === undefined || !canPlace(node.widget.kind, place) || !placeExists(widgets, place)) {
    return [...(widgets || [])];
  }

  if (!samePlace(from, place)) {
    return insertWidget(removeWidget(widgets, id), node, index, place);
  }

  return atPlace(widgets, place, (list) => {
    const out = [...list];
    const at0 = out.findIndex((w) => w.id === id);
    let at = typeof index === 'number' ? index : out.length;

    if (at0 < at) {
      at -= 1;
    }

    const [moved] = out.splice(at0, 1);

    out.splice(Math.max(0, Math.min(out.length, at)), 0, moved);

    return out;
  });
}

/** Replace one widget (by id, wherever it is) with the result of `fn(widget)`. */
export function updateWidget(widgets: WidgetNode[], id: string, fn: (w: WidgetNode) => WidgetNode): WidgetNode[] {
  return eachList(widgets, (list) => list.map((w) => (w.id === id ? fn(w) : w)));
}

/** Set a widget's column span (1..12). */
export function setColSpan(widgets: WidgetNode[], id: string, span: unknown): WidgetNode[] {
  return updateWidget(widgets, id, (w) => ({ ...w, colSpan: clampSpan(span) }));
}
