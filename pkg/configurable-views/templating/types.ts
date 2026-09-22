import type { RancherKubeMetadata } from '@shell/types/rancher/steve.api';

/**
 * The shapes behind the configurable Home. These are the STORED contract — a view round-trips
 * through a ConfigMap, so changing a field name here changes what already-saved Homes mean.
 */

/** Which building block a widget is. */
export type WidgetKind =
  | 'table'
  | 'counters'
  | 'statusSummary'
  | 'list'
  | 'barChart'
  | 'timeSeries'
  | 'text'
  | 'links'
  | 'banner'
  | 'clusterTable'
  | 'overview'
  | 'nav';

export type SortDir = 'asc' | 'desc';

/** 'view' covers every cluster the view can see; 'custom' only those named in `targets`. */
export type WidgetScope = 'view' | 'custom';

/** A links widget shows either Rancher's own links ('home') or the ones in `links` ('custom'). */
export type LinkSource = 'home' | 'custom';

export interface WidgetLink {
  label: string;
  url: string;
}

/** What one widget shows. Every field is optional — a widget with only a `kind` renders a default. */
export interface WidgetSpec {
  kind: WidgetKind;
  title: string;
  /** The Rancher/Kubernetes type it reads, including CRDs. */
  resource: string;
  where: WidgetScope;
  source: LinkSource;
  targets: string[];
  /** A Kubernetes type exists once per cluster, so a downstream type names exactly one. */
  cluster: string;
  /** A labels-or-fields expression: `env=prod`, `state != Active`. */
  filter: string;
  columns: string[];
  sortBy: string;
  sortDir: SortDir;
  groupBy: string;
  /** How many rows a list shows; 0 means no limit. */
  limit: number;
  /** Markdown, for a text widget. */
  body: string;
  links: WidgetLink[];
  /** Grafana panel URL, for a time series widget. */
  url: string;
  /** An overview summarises several types at once. */
  resources: string[];
  subtitle?: string;
  image?: string;
}

/** Sides of a box, in px or any CSS length. */
export interface Sides {
  top: number | string;
  right: number | string;
  bottom: number | string;
  left: number | string;
}

export const NODE_WIDGET = 'widget';
export const NODE_TEMPLATE = 'template';

interface NodeBox {
  id: string;
  /** 1…12 columns of the grid. */
  colSpan: number;
  height: number | string;
  margin: Sides;
  padding: Sides;
}

/** One building block on the grid. */
export interface WidgetNode extends NodeBox {
  type: typeof NODE_WIDGET;
  widget: WidgetSpec;
}

/** A leaf rendering one stored template ConfigMap. */
export interface TemplateNode extends NodeBox {
  type: typeof NODE_TEMPLATE;
  template: string;
}

export type PanelNode = WidgetNode | TemplateNode;

/**
 * One named view, and one tab in the bar.
 *
 * `widgets` is one flat ordered list that WRAPS — a widget starts a new line when there is no room
 * left, the way a paragraph wraps words. There are no rows.
 */
export interface LayoutPanel {
  id: string;
  name: string;
  /** px between widgets. */
  gap: number;
  /** px around the whole grid. */
  pad: number;
  widgets: PanelNode[];
  /** This panel IS the published organization template. */
  org?: boolean;
  /** The published panel this one was forked from. */
  from?: string;
}

/** Rancher's own Home, kept as a tab. It has no grid, so there is nothing to lay out. */
export interface StockPanel {
  id: string;
  name: string;
  kind: 'stock';
  org?: boolean;
  from?: string;
}

export type Panel = LayoutPanel | StockPanel;

/** The whole saved document: the panels a person can switch between, and which opens by default. */
export interface View {
  panels: Panel[];
  defaultPanelId?: string;
}

/**
 * One resource instance as a widget sees it: a Steve model, so the raw fields plus whatever getters
 * its model class adds. Indexed with `unknown` rather than `any`, so reading an untyped field is a
 * deliberate cast at the call site instead of a silent hole.
 */
export interface ResourceRow {
  id?: string;
  type?: string;
  metadata?: Partial<RancherKubeMetadata> & { creationTimestamp?: string; state?: { name?: string } };
  spec?: Record<string, unknown>;
  status?: Record<string, unknown>;
  nameDisplay?: string;
  stateDisplay?: string;
  state?: string;
  clusterName?: string;
  [key: string]: unknown;
}

/** A widget inside a stored JSON template — a looser, older shape than WidgetSpec. */
export interface TemplateWidget {
  type: string;
  [key: string]: unknown;
}

export interface ResolvedTemplate {
  kind: 'json' | 'code' | 'missing';
  widgets: TemplateWidget[];
}
