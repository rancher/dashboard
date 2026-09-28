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

import {
  MANAGEMENT, CAPI, EVENT, FLEET, LONGHORN, POD, SERVICE, INGRESS, PVC, NODE, WORKLOAD_TYPES
} from '@shell/config/types';
import type { WidgetKind, WidgetSpec } from './types';

/** The little preview drawn on a catalog tile (see CatalogTile.vue). */
export type CatalogIcon = 'table' | 'links' | 'banner' | 'tabs';

/** One tile in the editor's Add tab. */
export interface CatalogEntry {
  id: string;
  name: string;
  desc: string;
  icon: CatalogIcon;
  /** The column width it lands on the grid with. */
  span: number;
  spec: Partial<WidgetSpec> & { kind: WidgetKind };
}

/** One entry in a widget's Resource picker, and where that type lives (see SUGGESTED_RESOURCES). */
export interface SuggestedResource {
  value: string;
  label: string;
  downstream?: boolean;
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

/**
 * The kinds that are ABOUT one cluster - the pieces of a cluster's dashboard.
 *
 * Each shows the cluster it names, or the page's when it names none (see useWidgetCluster), so the
 * settings ask for a cluster for these and for nothing else of theirs.
 */
const CLUSTER_WIDGETS: WidgetKind[] = [
  WIDGET_CLUSTER_HEADER, WIDGET_RESOURCE_CARDS, WIDGET_CAPACITY, WIDGET_COMPONENT_STATUS, WIDGET_OVERVIEW, WIDGET_EVENTS, WIDGET_CERTIFICATES
];

export function isClusterWidget(kind: string): boolean {
  return (CLUSTER_WIDGETS as string[]).includes(kind);
}

/** The resource a fresh building block starts on — the one every Rancher install has. */
const CLUSTER = CAPI.RANCHER_CLUSTER;

/**
 * BUILDING BLOCKS — "Any resource, including your own CRDs."
 * `icon` is the little preview drawn on the tile (see CatalogTile.vue).
 */
export const BUILDING_BLOCKS: CatalogEntry[] = [
  {
    id:   WIDGET_TABLE,
    name: 'Table',
    desc: 'Rows of a resource with the columns you pick',
    icon: 'table',
    span: 8,
    spec: {
      // No columns: a fresh Table shows everything its resource has (see WidgetTable).
      kind: WIDGET_TABLE, title: 'Table', resource: CLUSTER, sortBy: 'name'
    },
  },
  {
    id:   WIDGET_LINKS,
    name: 'Links',
    desc: 'Your own list of links',
    icon: 'links',
    span: 4,
    spec: { kind: WIDGET_LINKS, source: 'custom' },
  },
  {
    id:   WIDGET_TABS,
    name: 'Tabs',
    desc: 'Tabs, each holding widgets of its own',
    icon: 'tabs',
    span: 12,
    // Ids are left empty so every drop makes its own (see normalizeTabs).
    spec: {
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
    id:   'home-cluster-table',
    name: 'Home cluster table',
    desc: "The Home's own cluster table, exactly as it is",
    icon: 'table',
    span: 12,
    // Not the Table block pointed at clusters — the real cluster section from the stock Home, with
    // its own columns, sorting and buttons. Nothing to set up.
    spec: { kind: WIDGET_CLUSTER_TABLE, title: '' },
  },
  {
    id:   'cluster-list',
    name: 'Cluster list',
    desc: 'Table of Cluster',
    icon: 'table',
    span: 8,
    spec: {
      kind:     WIDGET_TABLE,
      title:    'Clusters',
      resource: CLUSTER,
      columns:  ['state', 'name', 'provider', 'version', 'nodes', 'cpu'],
      sortBy:   'name',
    },
  },
  {
    id:   'cluster-header',
    name: 'Cluster header',
    desc: 'Name, state, provider and version of a cluster',
    icon: 'banner',
    span: 12,
    spec: { kind: WIDGET_CLUSTER_HEADER, title: '' },
  },
  {
    id:   'resource-cards',
    name: 'Resource cards',
    desc: "A cluster's total resources, nodes and deployments",
    icon: 'table',
    span: 12,
    spec: { kind: WIDGET_RESOURCE_CARDS, title: '' },
  },
  {
    id:   'cluster-capacity',
    name: 'Capacity',
    desc: "A cluster's pods, CPU and memory, reserved against what it has",
    icon: 'table',
    span: 12,
    spec: { kind: WIDGET_CAPACITY, title: '' },
  },
  {
    id:   'cluster-component-status',
    name: 'Component status',
    desc: "A cluster's etcd, scheduler, controller manager and Rancher and Fleet agents",
    icon: 'links',
    span: 12,
    spec: { kind: WIDGET_COMPONENT_STATUS, title: '' },
  },
  {
    id:   'workload-overview',
    name: 'Workload overview',
    desc: "A cluster's workloads by state, by type and by namespace",
    icon: 'table',
    span: 12,
    spec: { kind: WIDGET_OVERVIEW, title: '' },
  },
  {
    id:   'cluster-events',
    name: 'Events',
    desc: "A cluster's events, newest first",
    icon: 'table',
    span: 12,
    spec: { kind: WIDGET_EVENTS, title: '' },
  },
  {
    id:   'cluster-certificates',
    name: 'Certificates',
    desc: "A cluster's TLS certificates, soonest to expire first",
    icon: 'table',
    span: 12,
    spec: { kind: WIDGET_CERTIFICATES, title: '' },
  },
  {
    id:   'welcome-banner',
    name: 'Welcome banner',
    desc: 'The Rancher banner across the top',
    icon: 'banner',
    span: 12,
    spec: { kind: WIDGET_BANNER, title: '' },
  },
  {
    id:   'community-links',
    name: 'Community links',
    desc: "Rancher's own Docs / Forums / Slack list",
    icon: 'links',
    span: 4,
    spec: { kind: WIDGET_LINKS, source: 'home' },
  },
];

/** The building block a widget kind came from — for the "Selected: Clusters (Table)" label. */
export function blockName(kind: string): string {
  return BUILDING_BLOCKS.find((b) => b.id === kind)?.name ||
    READY_MADE.find((r) => r.spec.kind === kind)?.name ||
    kind;
}

/** Case-insensitive search over a catalog list (name + description), as the Add tab's box does. */
export function searchCatalog(list: CatalogEntry[], query: string): CatalogEntry[] {
  const needle = `${ query || '' }`.trim().toLowerCase();

  if (!needle) {
    return list;
  }

  return list.filter((entry) => `${ entry.name } ${ entry.desc }`.toLowerCase().includes(needle));
}

/**
 * The resources offered in a widget's "Resource" picker. Any type Rancher knows can be typed in,
 * but these are the ones worth suggesting.
 */
/**
 * The types the Resource picker suggests, and — the part that matters — WHERE each one lives.
 *
 * Rancher serves two different APIs and a widget has to know which it is asking:
 *
 *   GLOBAL      /v1 on the Rancher server. Its own management types (Cluster, User, Project,
 *               Fleet) plus, incidentally, the LOCAL cluster's own Kubernetes resources.
 *   DOWNSTREAM  /k8s/clusters/<id>/v1, a separate Steve API per cluster. Every Kubernetes type
 *               lives here, once per cluster, so a widget showing one has to say WHICH cluster.
 *
 * `downstream: true` is what makes the settings ask for a cluster. Without it a Pod widget
 * would silently show the local cluster's pods and call them "Pods", which is the sort of quiet
 * wrong answer a dashboard should never give.
 */
export const SUGGESTED_RESOURCES: SuggestedResource[] = [
  { value: CAPI.RANCHER_CLUSTER, label: 'Cluster (provisioning.cattle.io)' },
  { value: MANAGEMENT.CLUSTER, label: 'Cluster (management.cattle.io)' },
  { value: MANAGEMENT.NODE, label: 'Node (management.cattle.io)' },
  { value: MANAGEMENT.PROJECT, label: 'Project (management.cattle.io)' },
  { value: MANAGEMENT.USER, label: 'User (management.cattle.io)' },
  {
    value: EVENT, label: 'Event (v1)', downstream: true
  },
  { value: FLEET.GIT_REPO, label: 'GitRepo (fleet.cattle.io)' },
  { value: FLEET.BUNDLE, label: 'Bundle (fleet.cattle.io)' },

  {
    value: POD, label: 'Pod', downstream: true
  },
  {
    value: WORKLOAD_TYPES.DEPLOYMENT, label: 'Deployment (apps)', downstream: true
  },
  {
    value: WORKLOAD_TYPES.DAEMON_SET, label: 'DaemonSet (apps)', downstream: true
  },
  {
    value: WORKLOAD_TYPES.STATEFUL_SET, label: 'StatefulSet (apps)', downstream: true
  },
  {
    value: WORKLOAD_TYPES.JOB, label: 'Job (batch)', downstream: true
  },
  {
    value: WORKLOAD_TYPES.CRON_JOB, label: 'CronJob (batch)', downstream: true
  },
  {
    value: NODE, label: 'Node (v1)', downstream: true
  },
  {
    value: SERVICE, label: 'Service (v1)', downstream: true
  },
  {
    value: INGRESS, label: 'Ingress (networking.k8s.io)', downstream: true
  },
  {
    value: PVC, label: 'PersistentVolumeClaim (v1)', downstream: true
  },
  {
    value: LONGHORN.VOLUMES, label: 'Volume (longhorn.io)', downstream: true
  },
];

/**
 * The name this extension's tables page under.
 *
 * Server-side pagination is enabled per resource per CONTEXT, so a context is what keeps this
 * feature's paging to this feature. Registered in index.ts; passed by the table widget.
 */
export const PAGINATION_CONTEXT = 'configurable-views';

/**
 * The global types whose tables should page.
 *
 * Only the ones this extension suggests, and only the global ones - a downstream type is read
 * through a cluster's own API, which this widget pages itself. Being a list rather than "everything
 * this extension shows" is the point: each entry is a type we have looked at and a table we have
 * seen page correctly, not a promise made on behalf of types nobody has tried.
 */
export const PAGINATED_RESOURCES: { resource: string; context: string[] }[] = SUGGESTED_RESOURCES
  .filter((r) => !r.downstream)
  .map((r) => ({ resource: r.value, context: [PAGINATION_CONTEXT] }));

/**
 * Does this type have to be read from a named cluster?
 *
 * Only the suggestions say so — a type typed in by hand is assumed to be global, because that is
 * the API this extension can always reach.
 */
export function isDownstream(resource: string): boolean {
  return !!SUGGESTED_RESOURCES.find((r) => r.value === resource)?.downstream;
}
