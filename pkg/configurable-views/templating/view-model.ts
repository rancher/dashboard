// The VIEW model — the structure behind the configurable Home.
//
// Vocabulary (used consistently in the code, the UI and the stored ConfigMap):
//
//   VIEW     a page. Holds one or more PANELS.
//   PANEL    one named view, and one tab in the bar. A LAYOUT panel is a flat list of WIDGETS; a
//            STOCK panel has no list at all and renders Rancher's own Home, so a view can mix the
//            real Home in as a tab beside configured ones.
//   WIDGET   one building block on the grid — a table, a cluster's capacity, a row of links — sized
//            by a COLUMN SPAN (1…12) and configured through its own settings panel.
//
// There are NO rows. A panel's widgets are one flat, ordered list, and they WRAP: a widget starts a
// new line when there is no room left on the current one, exactly as a paragraph wraps words. Rows
// used to be explicit nodes you could select and pad; they are gone, because a row was structure
// pretending to be a thing you configure. Spacing now lives in the two places that own it — per
// widget (its own margin and padding) and per view (the gap between every widget).
//
// Pure functions — no Vue, no store. Everything that reads STORED data takes `unknown` and checks
// what it gets: a view round-trips through a ConfigMap anyone with access can edit by hand.

import {
  NODE_WIDGET, type LayoutPanel, type Panel, type Sides, type StockPanel, type View, type WidgetKind,
  type WidgetNode, type WidgetSpec
} from './types';

export { NODE_WIDGET };

/** What a stock panel says it is. See isStockPanel. */
const PANEL_STOCK = 'stock';

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
 *               clusterCertificates | clusterComponentStatus
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

  return out;
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
 * dropped: templates are gone, and a panel is widgets only.
 */
function normalizeNode(node: unknown): WidgetNode | null {
  if (!isObject(node)) {
    return null;
  }

  return node.type === NODE_WIDGET || (!node.type && node.widget) ? newWidgetNode(node.widget, node as WidgetBoxOptions) : null;
}

/**
 * Flatten anything a panel might hold into one ordered list of widgets.
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

// ---- panels & views -----------------------------------------------------------------------------

/** What a new panel can start with. */
export interface PanelOptions {
  id?: string;
  gap?: unknown;
  pad?: unknown;
  widgets?: WidgetNode[];
}

/** A new PANEL — one named VIEW in the tab strip. */
export function newPanel(name?: string, opts: PanelOptions = {}): LayoutPanel {
  return {
    id:      opts.id || newId('panel'),
    name:    name || 'Untitled view',
    gap:     num(opts.gap, DEFAULT_GAP),
    pad:     num(opts.pad, DEFAULT_PAGE_PADDING),
    widgets: Array.isArray(opts.widgets) ? opts.widgets : [],
  };
}

/**
 * The id of the built-in STOCK panel: Rancher's own page, offered as a tab on every configurable
 * page whether or not a stock panel was ever saved (see builtInStockPanel).
 */
export const BUILT_IN_STOCK_ID = 'built-in-stock';

/**
 * Rancher's own page as a panel, when nothing stored is one. Not saved anywhere - it is always there,
 * so it cannot be deleted, published or renamed, and a page with no stored panels at all still shows
 * the page Rancher already had, as a tab.
 */
export function builtInStockPanel(name: string): StockPanel {
  return {
    id: BUILT_IN_STOCK_ID, name, kind: PANEL_STOCK
  };
}

/** True when a panel renders the stock Rancher home rather than a grid of widgets. */
export function isStockPanel(panel: unknown): panel is StockPanel {
  return isObject(panel) && panel.kind === PANEL_STOCK;
}

function normalizePanel(panel: Loose): Panel {
  // A stock panel carries no widgets — there is nothing to lay out.
  const out: Panel = isStockPanel(panel) ? {
    id: str(panel.id) || newId('panel'), name: str(panel.name) || 'Home', kind: PANEL_STOCK
  } : {
    id:      str(panel.id) || newId('panel'),
    name:    str(panel.name) || 'Untitled view',
    gap:     num(panel.gap, DEFAULT_GAP),
    pad:     num(panel.pad, DEFAULT_PAGE_PADDING),
    // `widgets` is the shape now; `organizer` is the tree this replaced.
    widgets: flattenWidgets(panel.widgets ?? panel.organizer),
  };

  // Published organization templates are marked so the UI can show (and protect) them.
  if (panel.org) {
    out.org = true;
  }

  // Which published view this one was forked from. It MUST survive a round trip through storage,
  // or the fork and its source both show up in the bar as two views with the same name.
  if (panel.from) {
    out.from = str(panel.from);
  }

  return out;
}

/** A VIEW with nothing saved in it. The page still shows its stock tab (see builtInStockPanel). */
function emptyView(): View {
  return { panels: [] };
}

/**
 * Coerce ANY stored value into a valid VIEW:
 *   - the current shape          { panels: [ { widgets } ] }
 *   - the organizer-tree shape   { panels: [ { organizer } ] }
 *   - the legacy dashboard shape { tabs:   [ { name } ] }
 *   - the legacy single name     "home"
 *
 * The two legacy shapes pointed at template ConfigMaps, which are gone; their tabs survive, empty.
 *
 * An empty list stays empty. It used to be replaced by a new panel named "Home" - the old way of
 * making sure a page had a tab - which invented a panel with a fresh id on every read, and named it
 * "Home" on pages that are not the Home. Every page now has its stock tab instead, stored or not.
 */
export function migrateToView(value: unknown): View {
  const finish = (panels: Panel[], source: Loose | null): View => {
    const out: View = { panels };
    const defaultId = str(source?.defaultPanelId);

    // Which view opens first. Dropped when it names a view that no longer exists.
    if (defaultId && out.panels.some((p) => p.id === defaultId)) {
      out.defaultPanelId = defaultId;
    }

    if (source?.disabled) {
      out.disabled = true;
    }

    return out;
  };

  // Current shape (and the organizer-tree shape, which normalizePanel flattens).
  if (isObject(value) && Array.isArray(value.panels)) {
    return finish(value.panels.filter(isObject).map(normalizePanel), value);
  }

  // Legacy: tabs[] of template grids. The grids named templates; only the tabs are left.
  if (isObject(value) && Array.isArray(value.tabs)) {
    return finish(value.tabs.filter(isObject).map((t) => newPanel(str(t.name), { id: str(t.id) || undefined })), value);
  }

  // Legacy: a single applied template name. The template is gone, so there is nothing to show.
  if (typeof value === 'string' && value) {
    return finish([], null);
  }

  return emptyView();
}

// ---- list operations (used by the editor; all return NEW lists) ----------------------------------

/** Find a widget by id. */
export function findWidget(widgets: WidgetNode[] | null | undefined, id: string | null): WidgetNode | null {
  return (widgets || []).find((w) => w.id === id) || null;
}

/** Insert a widget at `index` (appends when the index is omitted or past the end). */
export function insertWidget(widgets: WidgetNode[], widget: WidgetNode, index?: number): WidgetNode[] {
  const list = [...(widgets || [])];
  const at = typeof index === 'number' ? Math.max(0, Math.min(list.length, index)) : list.length;

  list.splice(at, 0, widget);

  return list;
}

/** Remove a widget by id. */
export function removeWidget(widgets: WidgetNode[], id: string): WidgetNode[] {
  return (widgets || []).filter((w) => w.id !== id);
}

/** Move a widget one place earlier (-1) or later (+1) in the list. */
export function moveWidget(widgets: WidgetNode[], id: string, delta: number): WidgetNode[] {
  const list = [...(widgets || [])];
  const from = list.findIndex((w) => w.id === id);
  const to = from + delta;

  if (from < 0 || to < 0 || to >= list.length) {
    return list;
  }

  const [moved] = list.splice(from, 1);

  list.splice(to, 0, moved);

  return list;
}

/**
 * DRAG & DROP: move an existing widget to `index`. The index is corrected for the gap the widget
 * leaves behind, so dropping "just after myself" is a no-op rather than an off-by-one.
 */
export function moveWidgetTo(widgets: WidgetNode[], id: string, index?: number): WidgetNode[] {
  const list = [...(widgets || [])];
  const from = list.findIndex((w) => w.id === id);

  if (from < 0) {
    return list;
  }

  let at = typeof index === 'number' ? index : list.length;

  if (from < at) {
    at -= 1;
  }

  const [moved] = list.splice(from, 1);

  list.splice(Math.max(0, Math.min(list.length, at)), 0, moved);

  return list;
}

/** Replace one widget (by id) with the result of `fn(widget)`. */
export function updateWidget(widgets: WidgetNode[], id: string, fn: (w: WidgetNode) => WidgetNode): WidgetNode[] {
  return (widgets || []).map((w) => (w.id === id ? fn(w) : w));
}

/** Set a widget's column span (1..12). */
export function setColSpan(widgets: WidgetNode[], id: string, span: unknown): WidgetNode[] {
  return updateWidget(widgets, id, (w) => ({ ...w, colSpan: clampSpan(span) }));
}
