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
  | 'clusterComponentStatus'
  | 'clusterAlerts'
  | 'clusterMetrics'
  | 'clusterExtensionCards'
  | 'tabs';

export type SortDir = 'asc' | 'desc';

/** 'view' covers every cluster the view can see; 'custom' only those named in `targets`. */
export type WidgetScope = 'view' | 'custom';

/** Which of the cluster dashboard's Grafana dashboards a metrics widget shows. */
export type MetricsDashboard = 'cluster' | 'k8s' | 'etcd';

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
  /** A metrics widget's dashboard. */
  metrics?: MetricsDashboard;
  /** A Tabs widget's tabs, each with widgets of its own. */
  tabs?: WidgetTab[];
}

/**
 * One tab of a Tabs widget: a name, and a list of widgets that wraps exactly as a view's does.
 *
 * A tab holds any widget but another Tabs widget - one level of tabs inside a view's tabs is as deep
 * as a page should go.
 */
export interface WidgetTab {
  id: string;
  name: string;
  widgets: WidgetNode[];
}

/** Where a list of widgets lives when it is not the view's own: one tab of a Tabs widget on it. */
export interface WidgetPlace {
  /** The Tabs widget. */
  parentId: string;
  tabId: string;
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
  /** Empty columns between this widget and the one before it on its line (or the line's start). */
  offset?: number;
  /** Starts a line of its own, even when it would fit at the end of the line before. */
  newLine?: boolean;
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
 * left, the way a paragraph wraps words, or when it says so (`newLine`). There are no row objects:
 * a line is the widgets that share it, and a widget's `offset` is the room left empty before it.
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
  /**
   * The order this person dragged the bar's tabs into, as view keys (see orderKeyOf). Views not in
   * it keep their place after the ones that are.
   */
  order?: string[];
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

