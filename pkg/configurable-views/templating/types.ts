import type { RancherKubeMetadata } from '@shell/types/rancher/steve.api';

/**
 * The shapes behind the configurable pages. These are the STORED contract — a view set round-trips
 * through a ConfigMap, so changing a field name here changes what already-saved pages mean; when one
 * does change, the old name keeps being read (see migrateViewSet).
 *
 *   PAGE (the Home, a cluster's dashboard) → VIEWS (tabs, when there is more than one) → WIDGETS
 */

/** Which building block a widget is. */
export type WidgetKind =
  | 'table'
  | 'links'
  | 'banner'
  | 'clusterTable'
  | 'overview'
  | 'clusterHeader'
  | 'resourceCards'
  | 'clusterCapacity'
  | 'clusterEvents'
  | 'clusterCertificates'
  | 'clusterComponentStatus';

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
  /**
   * The cluster it shows, for a Kubernetes type or a cluster widget. '' follows the page: a cluster's
   * dashboard supplies its own, and the Home, which has none, asks. See useWidgetCluster.
   */
  cluster: string;
  /** A labels-or-fields expression: `env=prod`, `state != Active`. */
  filter: string;
  columns: string[];
  sortBy: string;
  sortDir: SortDir;
  /** Rows per page of a table; 0 means the default. */
  limit: number;
  links: WidgetLink[];
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

/**
 * A VIEW: one named arrangement of a page's widgets, and a tab in the bar when the page has more
 * than one.
 *
 * `widgets` is one flat ordered list that WRAPS — a widget starts a new line when there is no room
 * left, the way a paragraph wraps words. There are no rows.
 */
export interface LayoutView {
  id: string;
  name: string;
  /** px between widgets. */
  gap: number;
  /** px around the whole grid. */
  pad: number;
  widgets: WidgetNode[];
  /** This view IS the published organization template. */
  org?: boolean;
  /** The published view this one was forked from. */
  from?: string;
}

/** Rancher's own page - the Home, a cluster's dashboard - kept as a view. No grid, nothing to lay out. */
export interface StockView {
  id: string;
  name: string;
  kind: 'stock';
  org?: boolean;
  from?: string;
}

export type View = LayoutView | StockView;

/** What one scope - the organization, or one person - has saved for a page: its views, and which opens first. */
export interface ViewSet {
  views: View[];
  defaultViewId?: string;
  /** The scope is switched off: it renders nothing, and the scope beneath it shows instead. */
  disabled?: boolean;
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

