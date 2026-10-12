// The component catalog behind the editor's "Add" tab.
//
// Two lists, and the difference between them is the whole idea:
//
//   BUILDING BLOCKS  a shape with no data yet. Drop one on the grid and it asks what to show —
//                    any resource Rancher knows about, including your own CRDs.
//   READY-MADE       the same building blocks with their data already set, so the common
//                    dashboards are one drag away.
//
// Pure data — no Vue, no store. `spec` is a WIDGET spec (see normalizeWidget in view-model.ts);
// `span` is the column width the widget lands on the grid with.

import { MANAGEMENT, POD, WORKLOAD_TYPES } from '@shell/config/types';
import { DEFAULT_STATUS_CARDS } from './status-cards';
import type { WidgetKind, WidgetSpec } from './types';

/** The little preview drawn on a catalog tile (see CatalogTile.vue). */
export type CatalogIcon = 'table' | 'links' | 'banner' | 'tabs';

/** One tile in the editor's Add tab. */
export interface CatalogEntry {
  id: string;
  /** Translation keys for the tile's name and one-line description. */
  labelKey: string;
  descKey: string;
  icon: CatalogIcon;
  /** The column width it lands on the grid with. */
  span: number;
  spec: Partial<WidgetSpec> & { kind: WidgetKind };
  /** A tile's name and description as they are - for an entry the catalog does not translate (a widget Liz wrote). */
  label?: string;
  desc?: string;
}

/** A tile's name and description as the reader sees them. */
export const entryLabel = (entry: CatalogEntry, t: (key: string) => string): string => entry.label || t(entry.labelKey);
export const entryDesc = (entry: CatalogEntry, t: (key: string) => string): string => entry.desc ?? t(entry.descKey);

/** The tiles for the widgets Liz wrote that an admin approved. */
export function generatedEntries(widgets: { name: string; displayName: string; description: string }[], approvals: Record<string, string>): CatalogEntry[] {
  return widgets.filter((w) => approvals[w.name]).map((w) => ({
    id:       `generated:${ w.name }`,
    labelKey: '',
    descKey:  '',
    label:    w.displayName,
    desc:     w.description,
    icon:     'table',
    span:     6,
    spec:     {
      kind: WIDGET_GENERATED, title: '', component: w.name
    },
  }));
}

/** Every widget kind the renderer knows. */
export const WIDGET_TABLE: WidgetKind = 'table';
export const WIDGET_LINKS: WidgetKind = 'links';
export const WIDGET_BANNER: WidgetKind = 'banner';
export const WIDGET_CLUSTER_TABLE: WidgetKind = 'clusterTable';
export const WIDGET_OVERVIEW: WidgetKind = 'overview';
export const WIDGET_CLUSTER_HEADER: WidgetKind = 'clusterHeader';
export const WIDGET_RESOURCE_CARDS: WidgetKind = 'resourceCards';
export const WIDGET_CAPACITY: WidgetKind = 'clusterCapacity';
export const WIDGET_EVENTS: WidgetKind = 'clusterEvents';
export const WIDGET_CERTIFICATES: WidgetKind = 'clusterCertificates';
export const WIDGET_COMPONENT_STATUS: WidgetKind = 'clusterComponentStatus';
export const WIDGET_TABS: WidgetKind = 'tabs';
export const WIDGET_ALERTS: WidgetKind = 'clusterAlerts';
export const WIDGET_METRICS: WidgetKind = 'clusterMetrics';
export const WIDGET_EXTENSION_CARDS: WidgetKind = 'clusterExtensionCards';
export const WIDGET_STATUS_CARDS: WidgetKind = 'statusCards';
export const WIDGET_GENERATED: WidgetKind = 'generated';

/**
 * The kinds that are ABOUT one cluster - the pieces of a cluster's dashboard.
 *
 * Each shows the cluster it names, or the page's when it names none (see useWidgetCluster), so the
 * settings ask for a cluster for these and for nothing else of theirs.
 */
const CLUSTER_WIDGETS: WidgetKind[] = [
  WIDGET_CLUSTER_HEADER, WIDGET_RESOURCE_CARDS, WIDGET_CAPACITY, WIDGET_COMPONENT_STATUS, WIDGET_OVERVIEW, WIDGET_EVENTS,
  WIDGET_CERTIFICATES, WIDGET_ALERTS, WIDGET_METRICS, WIDGET_EXTENSION_CARDS, WIDGET_STATUS_CARDS, WIDGET_GENERATED
];

export function isClusterWidget(kind: string): boolean {
  return (CLUSTER_WIDGETS as string[]).includes(kind);
}

/** The types the Workloads overview counts, in its order - a status widget's "workloads". */
const WORKLOAD_TYPES_COUNTED = [
  WORKLOAD_TYPES.DEPLOYMENT, WORKLOAD_TYPES.DAEMON_SET, WORKLOAD_TYPES.STATEFUL_SET, WORKLOAD_TYPES.JOB, WORKLOAD_TYPES.CRON_JOB, POD
];

/**
 * The resource a fresh building block starts on: clusters, which every Rancher install has, of the
 * type Rancher lists them by (the Home's cluster list, the side bar).
 */
const CLUSTER = MANAGEMENT.CLUSTER;

/**
 * BUILDING BLOCKS — "Any resource, including your own CRDs."
 * `icon` is the little preview drawn on the tile (see CatalogTile.vue).
 */
export const BUILDING_BLOCKS: CatalogEntry[] = [
  {
    id:       WIDGET_TABLE,
    labelKey: 'configurableViews.catalog.table.name',
    descKey:  'configurableViews.catalog.table.desc',
    icon:     'table',
    span:     8,
    spec:     {
      // Columns, sort and filter are the table views' own (see WidgetTable).
      kind: WIDGET_TABLE, title: 'Table', resource: CLUSTER
    },
  },
  {
    id:       WIDGET_STATUS_CARDS,
    labelKey: 'configurableViews.catalog.statusCards.name',
    descKey:  'configurableViews.catalog.statusCards.desc',
    icon:     'table',
    span:     6,
    // Pods by status: the card the Workloads overview draws per type
    spec:     {
      kind: WIDGET_STATUS_CARDS, title: '', status: { ...DEFAULT_STATUS_CARDS }
    },
  },
  {
    id:       WIDGET_LINKS,
    labelKey: 'configurableViews.catalog.links.name',
    descKey:  'configurableViews.catalog.links.desc',
    icon:     'links',
    span:     4,
    spec:     { kind: WIDGET_LINKS, source: 'custom' },
  },
  {
    id:       WIDGET_TABS,
    labelKey: 'configurableViews.catalog.tabs.name',
    descKey:  'configurableViews.catalog.tabs.desc',
    icon:     'tabs',
    span:     12,
    // Ids are left empty so every drop makes its own (see normalizeTabs).
    spec:     {
      kind:  WIDGET_TABS,
      title: '',
      tabs:  [{
        id: '', name: 'Tab 1', widgets: []
      }, {
        id: '', name: 'Tab 2', widgets: []
      }],
    },
  },
];

/**
 * READY-MADE — "Building blocks with their data already set."
 * Each is one of the blocks above with a resource, columns and sort already chosen.
 */
export const READY_MADE: CatalogEntry[] = [
  {
    id:       'home-cluster-table',
    labelKey: 'configurableViews.catalog.homeClusterTable.name',
    descKey:  'configurableViews.catalog.homeClusterTable.desc',
    icon:     'table',
    span:     12,
    // Not the Table block pointed at clusters — the real cluster section from the stock Home, with
    // its own columns, sorting and buttons. Nothing to set up.
    spec:     { kind: WIDGET_CLUSTER_TABLE, title: '' },
  },
  {
    id:       'cluster-header',
    labelKey: 'configurableViews.catalog.clusterHeader.name',
    descKey:  'configurableViews.catalog.clusterHeader.desc',
    icon:     'banner',
    span:     12,
    spec:     { kind: WIDGET_CLUSTER_HEADER, title: '' },
  },
  {
    id:       'resource-cards',
    labelKey: 'configurableViews.catalog.resourceCards.name',
    descKey:  'configurableViews.catalog.resourceCards.desc',
    icon:     'table',
    span:     12,
    spec:     { kind: WIDGET_RESOURCE_CARDS, title: '' },
  },
  {
    id:       'cluster-capacity',
    labelKey: 'configurableViews.catalog.capacity.name',
    descKey:  'configurableViews.catalog.capacity.desc',
    icon:     'table',
    span:     12,
    spec:     { kind: WIDGET_CAPACITY, title: '' },
  },
  {
    id:       'cluster-component-status',
    labelKey: 'configurableViews.catalog.componentStatus.name',
    descKey:  'configurableViews.catalog.componentStatus.desc',
    icon:     'links',
    span:     12,
    spec:     { kind: WIDGET_COMPONENT_STATUS, title: '' },
  },
  {
    id:       'workload-overview',
    labelKey: 'configurableViews.catalog.workloadOverview.name',
    descKey:  'configurableViews.catalog.workloadOverview.desc',
    icon:     'table',
    span:     12,
    spec:     { kind: WIDGET_OVERVIEW, title: '' },
  },
  // The status cards, set up for the questions an overview is asked most
  {
    id:       'status-workloads-by-namespace',
    labelKey: 'configurableViews.catalog.statusByNamespace.name',
    descKey:  'configurableViews.catalog.statusByNamespace.desc',
    icon:     'table',
    span:     12,
    spec:     {
      kind:   WIDGET_STATUS_CARDS,
      title:  '',
      status: {
        ...DEFAULT_STATUS_CARDS, resources: [...WORKLOAD_TYPES_COUNTED], cards: 'namespace', rows: 'type'
      },
    },
  },
  {
    id:       'status-needs-attention',
    labelKey: 'configurableViews.catalog.statusNeedsAttention.name',
    descKey:  'configurableViews.catalog.statusNeedsAttention.desc',
    icon:     'table',
    span:     6,
    spec:     {
      kind:   WIDGET_STATUS_CARDS,
      title:  'Needs attention',
      status: {
        ...DEFAULT_STATUS_CARDS, resources: [], cards: 'none', rows: 'type', only: 'warning', top: 10
      },
    },
  },
  {
    id:       'status-top-resources',
    labelKey: 'configurableViews.catalog.statusTopResources.name',
    descKey:  'configurableViews.catalog.statusTopResources.desc',
    icon:     'table',
    span:     6,
    spec:     {
      kind:   WIDGET_STATUS_CARDS,
      title:  'Top resources by count',
      status: {
        ...DEFAULT_STATUS_CARDS, resources: [], cards: 'none', rows: 'type', top: 10, colors: 'none'
      },
    },
  },
  {
    id:       'status-busiest-namespaces',
    labelKey: 'configurableViews.catalog.statusBusiestNamespaces.name',
    descKey:  'configurableViews.catalog.statusBusiestNamespaces.desc',
    icon:     'table',
    span:     6,
    spec:     {
      kind:   WIDGET_STATUS_CARDS,
      title:  'Namespaces with the most pods',
      status: {
        ...DEFAULT_STATUS_CARDS, cards: 'none', rows: 'namespace', top: 10
      },
    },
  },
  {
    id:       'cluster-events',
    labelKey: 'configurableViews.catalog.events.name',
    descKey:  'configurableViews.catalog.events.desc',
    icon:     'table',
    span:     12,
    spec:     { kind: WIDGET_EVENTS, title: '' },
  },
  {
    id:       'cluster-certificates',
    labelKey: 'configurableViews.catalog.certificates.name',
    descKey:  'configurableViews.catalog.certificates.desc',
    icon:     'table',
    span:     12,
    spec:     { kind: WIDGET_CERTIFICATES, title: '' },
  },
  {
    id:       'cluster-alerts',
    labelKey: 'configurableViews.catalog.alerts.name',
    descKey:  'configurableViews.catalog.alerts.desc',
    icon:     'table',
    span:     12,
    spec:     { kind: WIDGET_ALERTS, title: '' },
  },
  {
    id:       'cluster-metrics',
    labelKey: 'configurableViews.catalog.clusterMetrics.name',
    descKey:  'configurableViews.catalog.clusterMetrics.desc',
    icon:     'banner',
    span:     12,
    spec:     {
      kind: WIDGET_METRICS, title: '', metrics: 'cluster'
    },
  },
  {
    id:       'k8s-metrics',
    labelKey: 'configurableViews.catalog.k8sMetrics.name',
    descKey:  'configurableViews.catalog.k8sMetrics.desc',
    icon:     'banner',
    span:     12,
    spec:     {
      kind: WIDGET_METRICS, title: '', metrics: 'k8s'
    },
  },
  {
    id:       'etcd-metrics',
    labelKey: 'configurableViews.catalog.etcdMetrics.name',
    descKey:  'configurableViews.catalog.etcdMetrics.desc',
    icon:     'banner',
    span:     12,
    spec:     {
      kind: WIDGET_METRICS, title: '', metrics: 'etcd'
    },
  },
  {
    id:       'extension-cards',
    labelKey: 'configurableViews.catalog.extensionCards.name',
    descKey:  'configurableViews.catalog.extensionCards.desc',
    icon:     'links',
    span:     12,
    spec:     { kind: WIDGET_EXTENSION_CARDS, title: '' },
  },
  {
    id:       'welcome-banner',
    labelKey: 'configurableViews.catalog.welcomeBanner.name',
    descKey:  'configurableViews.catalog.welcomeBanner.desc',
    icon:     'banner',
    span:     12,
    spec:     { kind: WIDGET_BANNER, title: '' },
  },
  {
    id:       'community-links',
    labelKey: 'configurableViews.catalog.communityLinks.name',
    descKey:  'configurableViews.catalog.communityLinks.desc',
    icon:     'links',
    span:     4,
    spec:     { kind: WIDGET_LINKS, source: 'home' },
  },
];

/**
 * The translation key for the building block a widget kind came from - for the "Selected: Clusters
 * (Table)" label. '' for a kind the catalog does not have, which the caller shows as the kind itself.
 */
export function blockLabelKey(kind: string): string {
  return BUILDING_BLOCKS.find((b) => b.id === kind)?.labelKey ||
    READY_MADE.find((r) => r.spec.kind === kind)?.labelKey ||
    '';
}

/**
 * Case-insensitive search over a catalog list, as the Add tab's box does. `textOf` gives an entry's
 * searchable text - its name and description as the person reading them sees them, translated.
 */
export function searchCatalog(list: CatalogEntry[], query: string, textOf: (entry: CatalogEntry) => string): CatalogEntry[] {
  const needle = `${ query || '' }`.trim().toLowerCase();

  if (!needle) {
    return list;
  }

  return list.filter((entry) => textOf(entry).toLowerCase().includes(needle));
}

/**
 * The resources offered in a widget's "Resource" picker. Any type Rancher knows can be typed in,
 * but these are the ones worth suggesting.
 */
/**
 * The context a table widget pages under: the Home's own.
 *
 * Server-side pagination is enabled per type per context, and the shell enables the cluster types
 * here, with the server-side columns their sorting and filtering need. Any other type is not paged in
 * this context, so its table reads it whole and pages it in the browser. The package registers no
 * paging of its own.
 */
export const PAGINATION_CONTEXT = 'home';
