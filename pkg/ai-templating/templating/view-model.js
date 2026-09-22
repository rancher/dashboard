// The VIEW model — the structure behind the configurable Home.
//
// Vocabulary (used consistently in the code, the UI and the stored ConfigMap):
//
//   VIEW     a page. Holds one or more PANELS.
//   PANEL    one named view, and one tab in the bar. A LAYOUT panel is a flat list of WIDGETS; a
//            STOCK panel has no list at all and renders Rancher's own Home, so a view can mix the
//            real Home in as a tab beside configured ones.
//   WIDGET   one building block on the grid — a table, counters, a bar chart, markdown — sized by a
//            COLUMN SPAN (1…12) and configured through its own settings panel. A TEMPLATE widget is
//            the older kind: a leaf rendering one stored template ConfigMap, sized the same way.
//
// There are NO rows. A panel's widgets are one flat, ordered list, and they WRAP: a widget starts a
// new line when there is no room left on the current one, exactly as a paragraph wraps words. Rows
// used to be explicit nodes you could select and pad; they are gone, because a row was structure
// pretending to be a thing you configure. Spacing now lives in the two places that own it — per
// widget (its own margin and padding) and per view (the gap between every widget).
//
// Pure functions — no Vue, no store.

/** Node types allowed in a panel's widget list. */
export const NODE_WIDGET = 'widget';
export const NODE_TEMPLATE = 'template';

/**
 * A PANEL is either a layout (a list of widgets) or the STOCK Rancher home rendered as-is. A stock
 * panel has no widgets and nothing to configure — it exists so a view can mix the real Home in as
 * one tab alongside configured ones.
 */
export const PANEL_LAYOUT = 'layout';
export const PANEL_STOCK = 'stock';

/** Widgets are laid out on this many columns. */
export const GRID_COLUMNS = 12;

/** Default column span for a newly dropped widget (half a line). */
export const DEFAULT_COL_SPAN = 6;

/** The gap between widgets. One value for the whole VIEW, not something per widget. */
export const DEFAULT_GAP = 20;

/** The space between the grid and the edges of the page. Also one value for the whole VIEW. */
export const DEFAULT_PAGE_PADDING = 20;

/** One grid row. `2 rows` is two of these plus the gap between them. */
export const ROW_HEIGHT = 156;

/**
 * WIDTH is chosen from four presets rather than 12 free columns — the four that read well on a
 * dashboard. `Advanced → Column span` still exposes the raw twelfths underneath.
 */
export const WIDTH_PRESETS = [
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
export const HEIGHT_PRESETS = [
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
export const SPACING_PRESETS = [
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

let idSeq = 0;

function uid(prefix) {
  idSeq += 1;

  return `${ prefix }-${ Date.now().toString(36) }${ idSeq.toString(36) }`;
}

/**
 * A fresh id with the same guarantees the factories use. Exported because the editor also mints ids
 * (forking a view, duplicating one) and two of those in the same millisecond must not collide —
 * which is exactly what a hand-rolled `Date.now()` id does.
 */
export function newId(prefix = 'id') {
  return uid(prefix);
}

// ---- value normalization ------------------------------------------------------------------------

/** Clamp a column span into 1..12. */
export function clampSpan(span) {
  const n = Math.round(Number(span));

  if (!n || Number.isNaN(n)) {
    return DEFAULT_COL_SPAN;
  }

  return Math.max(1, Math.min(GRID_COLUMNS, n));
}

/** A size is a number (px) or a CSS length string ('auto', '240px', '30%'). */
export function normalizeSize(value, fallback = 'auto') {
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }

  return fallback;
}

/** Turn a stored size into a CSS value (240 -> '240px', '100%' -> '100%'). */
export function cssSize(value) {
  return typeof value === 'number' ? `${ value }px` : `${ value }`;
}

/**
 * Normalize a four-sided box value (margin or padding) — each side a number (px) or a CSS length
 * string ('5%', '2rem').
 */
export function normalizeSides(sides) {
  const p = sides || {};
  const side = (v) => {
    if (typeof v === 'number' && !Number.isNaN(v)) {
      return v;
    }
    if (typeof v === 'string' && v.trim()) {
      return v.trim();
    }

    return 0;
  };

  return {
    top:    side(p.top),
    right:  side(p.right),
    bottom: side(p.bottom),
    left:   side(p.left),
  };
}

/** Build a CSS `margin`/`padding` shorthand for a four-sided box value. */
export function cssSides(sides) {
  const p = normalizeSides(sides);

  return [p.top, p.right, p.bottom, p.left].map(cssSize).join(' ');
}

// ---- presets ------------------------------------------------------------------------------------

/** The width preset a column span corresponds to (null when it matches none of them). */
export function widthPresetOf(span) {
  return WIDTH_PRESETS.find((p) => p.span === clampSpan(span))?.id || null;
}

/** Height in px for N grid rows, including the gaps they span. */
export function rowsHeight(rows, gap = DEFAULT_GAP) {
  return (rows * ROW_HEIGHT) + ((rows - 1) * gap);
}

/** The height preset a stored height corresponds to ('fit' for auto / anything unrecognized). */
export function heightPresetOf(height, gap = DEFAULT_GAP) {
  return HEIGHT_PRESETS.find((p) => p.rows && height === rowsHeight(p.rows, gap))?.id || 'fit';
}

/** The stored height for a height preset id. */
export function heightForPreset(id, gap = DEFAULT_GAP) {
  const preset = HEIGHT_PRESETS.find((p) => p.id === id);

  return preset?.rows ? rowsHeight(preset.rows, gap) : 'auto';
}

/** The spacing preset a widget's padding corresponds to (null once Advanced has overridden it). */
export function spacingPresetOf(padding) {
  const p = normalizeSides(padding);
  const same = p.top === p.right && p.right === p.bottom && p.bottom === p.left;

  return (same && SPACING_PRESETS.find((s) => s.padding === p.top)?.id) || null;
}

// ---- widgets ------------------------------------------------------------------------------------

/**
 * Normalize a WIDGET spec — the declarative description of what one widget shows. Every field is
 * optional; a widget with only a `kind` renders its own sensible default.
 *
 *   kind        which building block: table | counters | statusSummary | list | barChart |
 *               timeSeries | text | links | banner
 *   title       heading shown on the widget
 *   resource    the Rancher/Kubernetes type it reads (any kind Rancher knows, including CRDs)
 *   where       'view'   — the same clusters the view covers
 *               'custom' — only the clusters/namespaces in `targets`
 *   filter      a labels-or-fields expression: `env=prod`, `state != Active`
 *   cluster     for a downstream type, the cluster id to read it from
 *   columns     table columns to show, in order
 *   sortBy      field to sort on, `sortDir` 'asc' | 'desc'
 *   groupBy     field a bar chart / status summary groups by
 *   limit       how many rows a list shows
 *   body        markdown (text widget)
 *   source      'home' — Rancher's own links | 'custom' — the `links` below (links widget)
 *   links       [{ label, url }] (links widget)
 *   url         Grafana panel URL (time series widget)
 *   resources   the resource types an overview summarises
 */
export function normalizeWidget(widget) {
  const w = widget && typeof widget === 'object' ? widget : {};
  const str = (v, fallback = '') => (typeof v === 'string' ? v : fallback);
  const arr = (v) => (Array.isArray(v) ? v : []);

  const out = {
    kind:      str(w.kind, 'text'),
    title:     str(w.title),
    resource:  str(w.resource),
    where:     w.where === 'custom' ? 'custom' : 'view',
    source:    w.source === 'custom' ? 'custom' : 'home',
    targets:   arr(w.targets).filter((t) => typeof t === 'string'),
    // Which cluster a downstream type is read from — a Kubernetes type exists once per cluster, and
    // only one of them, because several clusters are several APIs and cannot be paged as one.
    cluster:   str(w.cluster) || arr(w.clusters).find((c) => typeof c === 'string') || '',
    filter:    str(w.filter),
    columns:   arr(w.columns).filter((c) => typeof c === 'string'),
    sortBy:    str(w.sortBy),
    sortDir:   w.sortDir === 'desc' ? 'desc' : 'asc',
    groupBy:   str(w.groupBy),
    limit:     Number.isFinite(Number(w.limit)) && Number(w.limit) > 0 ? Math.round(Number(w.limit)) : 0,
    body:      str(w.body),
    links:     arr(w.links).filter((l) => l && typeof l === 'object').map((l) => ({ label: str(l.label), url: str(l.url) })),
    url:       str(w.url),
    // An overview summarises several types at once, so it keeps a list rather than one `resource`.
    resources: arr(w.resources).filter((r) => typeof r === 'string'),
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

/** The box every widget on the grid carries: how wide, how tall, and its own spacing. */
function widgetBox(opts, defaultSpan) {
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

/** A new WIDGET — one building block on the grid. */
export function newWidgetNode(widget, opts = {}) {
  return {
    id:     opts.id || uid('w'),
    type:   NODE_WIDGET,
    widget: normalizeWidget(typeof widget === 'string' ? { kind: widget } : widget),
    ...widgetBox(opts, DEFAULT_COL_SPAN),
  };
}

/** A TEMPLATE widget — the older kind, rendering one stored template ConfigMap. */
export function newTemplateNode(template, opts = {}) {
  return {
    id:       opts.id || uid('tpl'),
    type:     NODE_TEMPLATE,
    template: template || '',
    ...widgetBox(opts, DEFAULT_COL_SPAN),
  };
}

/** Coerce one stored entry into a widget, or null when it is neither kind. */
function normalizeNode(node) {
  if (!node || typeof node !== 'object') {
    return null;
  }

  if (node.type === NODE_WIDGET || (!node.type && node.widget)) {
    return newWidgetNode(node.widget, node);
  }

  if (node.type === NODE_TEMPLATE || (!node.type && node.template)) {
    if (!node.template) {
      return null;
    }

    // A previous format sized widgets with a CSS width ('66%'); convert it to a column span.
    return newTemplateNode(node.template, { ...node, colSpan: node.colSpan ?? spanFromWidth(node.width) });
  }

  return null;
}

/** Convert an old percentage/fraction width into a 1..12 column span. */
function spanFromWidth(width) {
  if (typeof width === 'string' && width.trim().endsWith('%')) {
    const pct = parseFloat(width);

    if (!Number.isNaN(pct) && pct > 0) {
      return clampSpan((pct / 100) * GRID_COLUMNS);
    }
  }

  return GRID_COLUMNS;
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
function flattenWidgets(value) {
  const out = [];
  const walk = (node) => {
    if (!node || typeof node !== 'object') {
      return;
    }

    const leaf = normalizeNode(node);

    if (leaf) {
      out.push(leaf);

      return;
    }

    (Array.isArray(node.children) ? node.children : []).forEach(walk);
  };

  if (Array.isArray(value)) {
    value.forEach(walk);
  } else {
    walk(value);
  }

  return out;
}

// ---- panels & views -----------------------------------------------------------------------------

/** A new PANEL — one named VIEW in the tab strip. */
export function newPanel(name, opts = {}) {
  return {
    id:      opts.id || uid('panel'),
    name:    name || 'Untitled view',
    gap:     Number.isFinite(Number(opts.gap)) ? Number(opts.gap) : DEFAULT_GAP,
    pad:     Number.isFinite(Number(opts.pad)) ? Number(opts.pad) : DEFAULT_PAGE_PADDING,
    widgets: Array.isArray(opts.widgets) ? opts.widgets : [],
  };
}

/** A new STOCK panel: renders the real Rancher home, with no widgets of its own. */
export function newStockPanel(name) {
  return {
    id: uid('panel'), name: name || 'Home', kind: PANEL_STOCK
  };
}

/** True when a panel renders the stock Rancher home rather than a grid of widgets. */
export function isStockPanel(panel) {
  return panel?.kind === PANEL_STOCK;
}

function normalizePanel(panel) {
  // A stock panel carries no widgets — there is nothing to lay out.
  const out = isStockPanel(panel) ? {
    id: panel?.id || uid('panel'), name: panel?.name || 'Home', kind: PANEL_STOCK
  } : {
    id:      panel?.id || uid('panel'),
    name:    panel?.name || 'Untitled view',
    gap:     Number.isFinite(Number(panel?.gap)) ? Number(panel.gap) : DEFAULT_GAP,
    pad:     Number.isFinite(Number(panel?.pad)) ? Number(panel.pad) : DEFAULT_PAGE_PADDING,
    // `widgets` is the shape now; `organizer` is the tree this replaced.
    widgets: flattenWidgets(panel?.widgets ?? panel?.organizer),
  };

  // Published organization templates are marked so the UI can show (and protect) them.
  if (panel?.org) {
    out.org = true;
  }

  // Which published view this one was forked from. It MUST survive a round trip through storage,
  // or the fork and its source both show up in the bar as two views with the same name.
  if (panel?.from) {
    out.from = panel.from;
  }

  return out;
}

/** A new empty VIEW — one panel. */
export function emptyView() {
  return { panels: [newPanel('Home')] };
}

/**
 * Convert a LEGACY 12-column grid list ({ template, x, y, w, h, pad }) into widgets, in reading
 * order. The rows it described fall out of the spans wrapping.
 */
function gridToWidgets(gridPanels) {
  return (Array.isArray(gridPanels) ? gridPanels : [])
    .filter((p) => p && p.template)
    .map((p) => ({
      template: p.template,
      x:        Number(p.x) || 0,
      y:        Number(p.y) || 0,
      w:        clampSpan(Number(p.w) || GRID_COLUMNS),
      padding:  p.pad,
    }))
    .sort((a, b) => a.y - b.y || a.x - b.x)
    .map((item) => newTemplateNode(item.template, { colSpan: item.w, padding: item.padding }));
}

/**
 * Coerce ANY stored value into a valid VIEW:
 *   - the current shape          { panels: [ { widgets } ] }
 *   - the organizer-tree shape   { panels: [ { organizer } ] }
 *   - the legacy dashboard shape { tabs:   [ { panels: [grid] } ] }
 *   - the legacy single name     "home"
 */
export function migrateToView(value) {
  const finish = (panels, source) => {
    const out = { panels: panels.length ? panels : [newPanel('Home')] };

    // Which view opens first. Dropped when it names a view that no longer exists.
    if (source?.defaultPanelId && out.panels.some((p) => p.id === source.defaultPanelId)) {
      out.defaultPanelId = source.defaultPanelId;
    }

    if (source?.disabled) {
      out.disabled = true;
    }

    return out;
  };

  // Current shape (and the organizer-tree shape, which normalizePanel flattens).
  if (value && typeof value === 'object' && Array.isArray(value.panels)) {
    return finish(value.panels.filter((p) => p && typeof p === 'object').map(normalizePanel), value);
  }

  // Legacy: tabs[] of grid panels[].
  if (value && typeof value === 'object' && Array.isArray(value.tabs)) {
    const panels = value.tabs
      .filter((t) => t && typeof t === 'object')
      .map((t) => newPanel(t.name, { id: t.id, widgets: gridToWidgets(t.panels) }));

    return finish(panels, value);
  }

  // Legacy: a single applied template name.
  if (typeof value === 'string' && value) {
    return finish([newPanel('Home', { widgets: [newTemplateNode(value, { colSpan: GRID_COLUMNS })] })], null);
  }

  return emptyView();
}

// ---- list operations (used by the editor; all return NEW lists) ----------------------------------

/** Find a widget by id. */
export function findWidget(widgets, id) {
  return (widgets || []).find((w) => w.id === id) || null;
}

/** Where a widget sits in the list (-1 when it is not there). */
export function indexOfWidget(widgets, id) {
  return (widgets || []).findIndex((w) => w.id === id);
}

/** Insert a widget at `index` (appends when the index is omitted or past the end). */
export function insertWidget(widgets, widget, index) {
  const list = [...(widgets || [])];
  const at = typeof index === 'number' ? Math.max(0, Math.min(list.length, index)) : list.length;

  list.splice(at, 0, widget);

  return list;
}

/** Remove a widget by id. */
export function removeWidget(widgets, id) {
  return (widgets || []).filter((w) => w.id !== id);
}

/** Move a widget one place earlier (-1) or later (+1) in the list. */
export function moveWidget(widgets, id, delta) {
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
export function moveWidgetTo(widgets, id, index) {
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
export function updateWidget(widgets, id, fn) {
  return (widgets || []).map((w) => (w.id === id ? fn(w) : w));
}

/** Set a widget's column span (1..12). */
export function setColSpan(widgets, id, span) {
  return updateWidget(widgets, id, (w) => ({ ...w, colSpan: clampSpan(span) }));
}

/** Every template ConfigMap name referenced by a panel's widgets. */
export function templatesInView(widgets) {
  return (widgets || []).filter((w) => w.type === NODE_TEMPLATE).map((w) => w.template);
}
