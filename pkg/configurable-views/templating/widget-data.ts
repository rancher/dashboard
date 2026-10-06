// What a widget SHOWS: the data behind the cluster widgets (counts, capacity, health, monitoring), read
// from whichever cluster a widget names, and where a resource type is read from.
//
// A Table widget's columns, sort and filter are not here: they are the table views' own (see
// WidgetTable).
//
// Pure functions — no Vue. `rows` are Steve/Norman resource instances.

import type { Store } from 'vuex';
import type { RouteLocationRaw } from 'vue-router';
import { parseSi, createMemoryValues } from '@shell/utils/units';
import { PaginationParamFilter } from '@shell/types/store/pagination.types';
import { MANAGEMENT, METRIC, NODE } from '@shell/config/types';
import { NODE_ROLES } from '@shell/config/labels-annotations';
import { colorForState } from '@shell/plugins/dashboard-store/resource-class';
import { colorToCountName } from '@shell/components/ResourceSummary';
import { RESOURCES as DASHBOARD_RESOURCES } from '@shell/pages/c/_cluster/explorer/index.vue';
import type { MetricsDashboard, ResourceRow } from './types';

type Getters = Store<unknown>['getters'];

/** One way a Steve list can be sorted. */
export interface SteveSort {
  field: string;
  asc: boolean;
}


// ---- where a resource lives ---------------------------------------------------------------------

/**
 * Which store to read a type from.
 *
 * NOT `currentStore`: that answers "where does this type live when you are INSIDE a cluster", and
 * sends anything cluster-scoped — a Fleet GitRepo, a Longhorn Volume, an Event — to the `cluster`
 * store. The Home is not inside a cluster, so that store is empty here, and a widget asking it
 * reports the type as missing when it is installed and readable all along.
 *
 * The Home reads the local cluster through MANAGEMENT (Steve /v1), so prefer whichever store
 * actually has a schema for the type, management first.
 */
export function storeForType(getters: Getters, type: string): string {
  if (!type) {
    return 'management';
  }

  const stores = ['management', getters['currentStore'](type), 'cluster'];

  return stores.find((store) => store && getters[`${ store }/schemaFor`]?.(type)) || 'management';
}

/** Every cluster the user can see, as picker options, by the name a person would recognise. */
export function clusterOptions(getters: Getters): { id: string; label: string }[] {
  const clusters: { id: string; nameDisplay?: string; spec?: { displayName?: string } }[] = getters['management/all']?.(MANAGEMENT.CLUSTER) || [];

  return clusters
    .map((c) => ({ id: c.id, label: c.nameDisplay || c.spec?.displayName || c.id }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * One page of a type, read from ONE named cluster.
 *
 * One, because a Kubernetes type lives behind its cluster's own Steve API and several clusters are
 * several APIs: no backend can answer "rows 9 to 16 of the three of them combined". So the widget
 * names a single cluster and gets real pagination — the backend is asked for that page and returns
 * it with the total count.
 *
 * Or `whole`: up to `cap` rows at once, for a table that pages, sorts and filters them itself (the
 * table views do, and only see what they hold). `truncated` says when the cluster had more, because a
 * total that quietly stops being a total is worse than a visible limit.
 */
export interface ClusterPageArgs {
  resource: string;
  cluster: string;
  page?: number;
  pageSize?: number;
  /** A fixed order, as Steve fields. */
  sort?: SteveSort[];
  /** Read up to `cap` rows at once instead of a page. */
  whole?: boolean;
  cap?: number;
}

export interface ClusterPage {
  rows: ResourceRow[];
  count: number;
  truncated: boolean;
  serverPaged: boolean;
}

export async function fetchClusterPage(store: Store<unknown>, {
  resource, cluster, page = 1, pageSize = 10, sort = [], whole = false, cap = 500
}: ClusterPageArgs): Promise<ClusterPage> {
  if (!resource || !cluster) {
    return {
      rows: [], count: 0, truncated: false, serverPaged: false
    };
  }

  const res = await store.dispatch('management/findPage', {
    type: resource,
    opt:  {
      url:        `/k8s/clusters/${ encodeURIComponent(cluster) }/v1/${ resource }`,
      transient:  true,
      watch:      false,
      pagination: whole ? {
        page: 1, pageSize: cap, sort
      } : {
        page, pageSize, sort, filters: []
      },
    },
  });

  const count = res?.pagination?.result?.count ?? res?.data?.length ?? 0;

  return {
    rows:        res?.data || [],
    count:       whole ? (res?.data?.length ?? 0) : count,
    truncated:   whole && count > cap,
    serverPaged: !whole,
  };
}

// ---- ONE CLUSTER, READ DIRECTLY -------------------------------------------------------------------
//
// The cluster dashboard's own components read the `cluster` store, and that store holds ONE cluster:
// whichever the user last opened. A widget naming another cluster cannot use them - they would show
// the wrong cluster, or none - and loading its cluster into the store would switch the whole app's
// current cluster under the user. So a cluster widget reads its cluster itself, from that cluster's
// own API or from the management cluster, and hands the result to the stock component that draws it.
// Nothing is loaded, and two widgets can show two clusters side by side.

/** The management cluster behind a cluster id: name, state, provider, version, capacity. */
export function fetchManagementCluster<T = ResourceRow>(store: Store<unknown>, cluster: string): Promise<T> {
  return store.dispatch('management/find', { type: MANAGEMENT.CLUSTER, id: cluster });
}

// A header and a row of cards for the same cluster both want its counts, at the same moment. One
// request answers both: an answer is kept for a few seconds, and a request still in flight is
// shared rather than repeated. Short on purpose - this is de-duplication, not a cache to go stale.
const SHARED_MS = 5000;
const shared = new Map<string, { at: number; promise: Promise<unknown> }>();

function once<T>(key: string, load: () => Promise<T>): Promise<T> {
  const hit = shared.get(key);

  if (hit && Date.now() - hit.at < SHARED_MS) {
    return hit.promise as Promise<T>;
  }

  const promise = load().catch((e) => {
    shared.delete(key);
    throw e;
  });

  shared.set(key, { at: Date.now(), promise });

  return promise;
}

function clusterUrl(cluster: string, path: string): string {
  return `/k8s/clusters/${ encodeURIComponent(cluster) }/v1/${ path }`;
}

/** A cluster's counts: `{ <type>: { summary: { count, states } } }`, as Steve returns them. */
export type ClusterCounts = Record<string, { summary?: { count?: number; states?: Record<string, number> } }>;

export function fetchClusterCounts(store: Store<unknown>, cluster: string): Promise<ClusterCounts> {
  return once(`counts|${ cluster }`, async() => {
    const res = await store.dispatch('management/request', { url: clusterUrl(cluster, 'counts') });

    return res?.data?.[0]?.counts || {};
  });
}

/**
 * One type's counts, split the way the dashboard's resource cards split them.
 *
 * The same arithmetic as ResourceSummary's `resourceCounts`, over counts we fetched rather than the
 * `cluster` store's - which only ever holds the current cluster's. Built from the two helpers it is
 * built from, so a state means the same colour here as there.
 */
/** One ResourceSummary card's numbers. */
export interface CountSummary {
  total: number;
  useful: number;
  warningCount: number;
  errorCount: number;
}

export function summarizeCounts(counts: ClusterCounts | null | undefined, resource: string): CountSummary {
  const summary = counts?.[resource]?.summary || {};
  const out: CountSummary = {
    total: summary.count || 0, useful: summary.count || 0, warningCount: 0, errorCount: 0
  };

  Object.entries(summary.states || {}).forEach(([state, count]) => {
    out.useful -= count;
    out[colorToCountName(colorForState(state)) as keyof CountSummary] += count;
  });

  return out;
}

/**
 * The dashboard's "Total Resources" card, for any cluster.
 *
 * Summed over the same set the dashboard sums: its fixed RESOURCES list, plus whichever counted
 * types `type-map/isIgnored` picks out - asked exactly as the page asks it, so the total is the
 * page's total. The page then keeps only types the loaded cluster has a schema for; a cluster that
 * is not loaded has no schemas here, and its counts are already limited to what the user can list.
 */
export function totalCounts(getters: Getters, counts: ClusterCounts): CountSummary {
  const present = Object.keys(counts || {});
  const picked = present.filter((id) => getters['type-map/isIgnored']({ id }));
  const types = [...new Set([...picked, ...DASHBOARD_RESOURCES])].filter((id) => present.includes(id));

  return types.reduce<CountSummary>((acc, id) => {
    const one = summarizeCounts(counts, id);

    (Object.keys(acc) as (keyof CountSummary)[]).forEach((k) => {
      acc[k] += one[k];
    });

    return acc;
  }, {
    total: 0, useful: 0, warningCount: 0, errorCount: 0
  });
}

/**
 * A cluster's capacity, worked out as its dashboard works it out.
 *
 * The dashboard sums its SCHEDULABLE WORKER nodes - allocatable against what their pods request,
 * each node's own `pod-requests` annotation - and falls back to the cluster's `status` totals only
 * when it has none. "Used" is live usage from the metrics API over those same nodes, less what each
 * node keeps back for the system (capacity minus allocatable).
 *
 * Read from raw JSON, not node models: the Node model decides "worker" by looking up its management
 * node against the cluster that is OPEN, which is not this one. So that lookup is done here, against
 * this cluster's own management nodes, with the model's label fallback.
 *
 * Returns { pods, cores, memory, cpuUsed, ramUsed }; the last two are null without metrics.
 */
/** One HardwareResourceGauge's numbers. */
export interface Gauge {
  total: number;
  useful: number;
  units?: string;
}

export interface ClusterCapacity {
  /** False when the cluster reports nothing to allocate - the dashboard hides the section then. */
  hasStats: boolean;
  pods: Gauge;
  cores: Gauge;
  memory: Gauge;
  /** Live usage; null without a metrics server. */
  cpuUsed: Gauge | null;
  ramUsed: Gauge | null;
}

/** A node, as much of it as the capacity arithmetic reads. */
interface RawNode {
  metadata?: { name?: string; labels?: Record<string, string>; annotations?: Record<string, string> };
  spec?: { unschedulable?: boolean };
  status?: { allocatable?: Record<string, string>; capacity?: Record<string, string> };
}

export async function fetchClusterCapacity(store: Store<unknown>, cluster: string): Promise<ClusterCapacity> {
  const req = (url: string) => store.dispatch('management/request', { url });
  const [mgmtCluster, nodesRes, mgmtNodesRes, metricsRes] = await Promise.all([
    fetchManagementCluster(store, cluster),
    req(clusterUrl(cluster, `${ NODE }?pagesize=100000`)),
    req(`/v1/${ MANAGEMENT.NODE }/${ encodeURIComponent(cluster) }?pagesize=100000`).catch(() => null),
    // No metrics server, no live usage - which the dashboard also simply leaves out.
    req(clusterUrl(cluster, `${ METRIC.NODE }?pagesize=100000`)).catch(() => null),
  ]);

  const nodes: RawNode[] = nodesRes?.data || [];
  const workerByName: Record<string, boolean> = Object.fromEntries((mgmtNodesRes?.data || []).map((m: { status?: { nodeName?: string }; spec?: { worker?: boolean } }) => [m.status?.nodeName, !!m.spec?.worker]));
  const isWorker = (n: RawNode): boolean => {
    const name = n.metadata?.name || '';

    return name in workerByName ? workerByName[name] : `${ n.metadata?.labels?.[NODE_ROLES.WORKER] }` === 'true';
  };
  const schedulable = nodes.filter((n) => !n.spec?.unschedulable);
  const workers = schedulable.filter(isWorker);

  const requests = (n: RawNode): Record<string, string> => JSON.parse(n.metadata?.annotations?.['management.cattle.io/pod-requests'] || '{}');
  const agg = workers.reduce((a, n) => {
    const alloc = n.status?.allocatable || {};
    const cap = n.status?.capacity || {};
    const asked = requests(n);

    a.cpuAllocatable += parseSi(alloc.cpu || '0');
    a.ramAllocatable += parseSi(alloc.memory || '0');
    a.cpuReserved += parseSi(asked.cpu || '0');
    a.ramReserved += parseSi(asked.memory || '0');
    a.podReserved += parseSi(asked.pods || '0');
    a.podCapacity += parseSi(cap.pods || '0');
    a.systemReservedCpu += Math.max(parseSi(cap.cpu || '0') - parseSi(alloc.cpu || '0'), 0);
    a.systemReservedRam += Math.max(parseSi(cap.memory || '0') - parseSi(alloc.memory || '0'), 0);

    return a;
  }, {
    cpuAllocatable: 0, ramAllocatable: 0, cpuReserved: 0, ramReserved: 0, podReserved: 0, podCapacity: 0, systemReservedCpu: 0, systemReservedRam: 0
  });

  const status = (mgmtCluster?.status || {}) as { allocatable?: Record<string, string>; requested?: Record<string, string> };
  const byNodes = workers.length > 0;

  const pods = byNodes ? { total: agg.podCapacity, useful: agg.podReserved } : { total: parseSi(status.allocatable?.pods || '0'), useful: parseSi(status.requested?.pods || '0') };
  const cores = byNodes ? { total: agg.cpuAllocatable, useful: agg.cpuReserved } : { total: parseSi(status.allocatable?.cpu), useful: parseSi(status.requested?.cpu) };
  const memory = byNodes ? createMemoryValues(agg.ramAllocatable, agg.ramReserved) : createMemoryValues(status.allocatable?.memory, status.requested?.memory);

  // Usage only over the nodes counted above - the workers, or every schedulable node without them.
  const counted = new Set((byNodes ? workers : schedulable).map((n) => n.metadata?.name));
  const metrics: { metadata?: { name?: string }; usage?: Record<string, string> }[] = (metricsRes?.data || []).filter((m: { metadata?: { name?: string } }) => counted.has(m.metadata?.name));
  let cpuUsed: Gauge | null = null;
  let ramUsed: Gauge | null = null;

  if (metrics.length) {
    const cpu = metrics.reduce((t, m) => t + parseSi(m.usage?.cpu || '0'), 0);
    const ram = metrics.reduce((t, m) => t + parseSi(m.usage?.memory || '0'), 0);

    cpuUsed = { total: byNodes ? agg.cpuAllocatable : parseSi(status.allocatable?.cpu), useful: cpu - agg.systemReservedCpu };
    ramUsed = createMemoryValues(byNodes ? agg.ramAllocatable : status.allocatable?.memory, ram - agg.systemReservedRam);
  }

  // The dashboard hides the section for a cluster reporting nothing to allocate.
  const hasStats = byNodes || (status.allocatable?.cpu !== undefined && status.allocatable?.cpu !== '0' && status.requested?.cpu !== '0');

  return {
    hasStats, pods, cores, memory, cpuUsed, ramUsed
  };
}

/**
 * EVERY row of a type in one cluster, narrowed by `filters`, up to `cap`.
 *
 * For a list whose order the API cannot produce - certificates, sorted by when they expire, which is
 * read out of the certificate itself - the only honest way to sort is to hold them all. The
 * dashboard's own Certificates list does exactly this, and says why. `truncated` says when the cap
 * cut the list short, so the sort is never quietly over a sample.
 */
export async function fetchClusterRows<T = ResourceRow>(store: Store<unknown>, {
  resource, cluster, filters, cap = 500
}: { resource: string; cluster: string; filters?: PaginationParamFilter[]; cap?: number }): Promise<{ rows: T[]; truncated: boolean }> {
  const res = await store.dispatch('management/findPage', {
    type: resource,
    opt:  {
      url:        clusterUrl(cluster, resource),
      transient:  true,
      watch:      false,
      pagination: {
        page: 1, pageSize: cap, sort: [], filters: filters || []
      },
    },
  });
  const count = res?.pagination?.result?.count ?? res?.data?.length ?? 0;

  return { rows: res?.data || [], truncated: count > cap };
}

/** One type's state summary in one cluster: counts per state, and per namespace within each. */
export interface StateSummary {
  type: string;
  summary: { property: string; counts: Record<string, { total: number; namespace: Record<string, number> }> }[] | null;
  error: string | null;
}

/**
 * How many of each type a cluster has, per state and per namespace - the numbers behind the
 * Workloads overview, asked of the cluster named rather than the one that is open.
 *
 * The same request the overview makes (`summary=metadata.state.name&summaryonly&summarynamespaced`),
 * one per type. A type this user cannot list, or that the cluster does not serve, comes back as an
 * error for that type alone, which the overview leaves out exactly as it leaves out its own.
 */
export function fetchStateSummaries(store: Store<unknown>, cluster: string, types: string[]): Promise<StateSummary[]> {
  return Promise.all(types.map(async(type): Promise<StateSummary> => {
    try {
      const res = await store.dispatch('management/request', { url: `${ clusterUrl(cluster, type) }?summary=metadata.state.name&summaryonly&summarynamespaced` });

      return {
        type, summary: Array.isArray(res?.summary) ? res.summary : [], error: null
      };
    } catch (e) {
      return {
        type, summary: null, error: (e as Error)?.message || `Could not read ${ type }.`
      };
    }
  }));
}

// ---- monitoring: alerts and Grafana, for a named cluster ------------------------------------------

const MONITORING_NS = 'cattle-monitoring-system';
const GRAFANA = `/api/v1/namespaces/${ MONITORING_NS }/services/http:rancher-monitoring-grafana:80/proxy`;

/**
 * The cluster dashboard's Grafana dashboards, as its own page embeds them: a detail and a summary
 * for each, and the height it gives them. The page keeps these as private constants.
 */
export const METRICS_DASHBOARDS: Record<MetricsDashboard, { labelKey: string; detailUrl: string; summaryUrl: string; graphHeight: string }> = {
  cluster: {
    labelKey:    'clusterIndexPage.sections.clusterMetrics.label',
    detailUrl:   `${ GRAFANA }/d/rancher-cluster-nodes-1/rancher-cluster-nodes?orgId=1`,
    summaryUrl:  `${ GRAFANA }/d/rancher-cluster-1/rancher-cluster?orgId=1`,
    graphHeight: '875px',
  },
  k8s: {
    labelKey:    'clusterIndexPage.sections.k8sMetrics.label',
    detailUrl:   `${ GRAFANA }/d/rancher-k8s-components-nodes-1/rancher-kubernetes-components-nodes?orgId=1`,
    summaryUrl:  `${ GRAFANA }/d/rancher-k8s-components-1/rancher-kubernetes-components?orgId=1`,
    graphHeight: '600px',
  },
  etcd: {
    labelKey:    'clusterIndexPage.sections.etcdMetrics.label',
    detailUrl:   `${ GRAFANA }/d/rancher-etcd-nodes-1/rancher-etcd-nodes?orgId=1`,
    summaryUrl:  `${ GRAFANA }/d/rancher-etcd-1/rancher-etcd?orgId=1`,
    graphHeight: '600px',
  },
};

/** Whether a cluster has Rancher's monitoring, and which version - the version decides the Grafana URL's prefix. */
export async function fetchMonitoring(store: Store<unknown>, cluster: string): Promise<{ installed: boolean; version: string }> {
  for (const name of ['rancher-monitoring-dashboards', 'rancher-monitoring']) {
    try {
      const app = await store.dispatch('management/request', { url: clusterUrl(cluster, `catalog.cattle.io.apps/${ MONITORING_NS }/${ name }`), redirectUnauthorized: false });

      if (app?.metadata?.name) {
        return { installed: true, version: app.spec?.chart?.metadata?.version || '' };
      }
    } catch (e) {}
  }

  return { installed: false, version: '' };
}

/** One alert as Alertmanager reports it - the fields the dashboard's alert table reads. */
export interface Alert {
  fingerprint?: string;
  labels?: { alertname?: string; severity?: string };
  annotations?: Record<string, string>;
}

/** A cluster's firing alerts, from its Alertmanager (v2, else v1), through Rancher's proxy to that cluster. */
export async function fetchAlerts(store: Store<unknown>, cluster: string): Promise<Alert[]> {
  const base = `/k8s/clusters/${ encodeURIComponent(cluster) }/api/v1/namespaces/${ MONITORING_NS }/services/http:rancher-monitoring-alertmanager:9093/proxy/api`;

  try {
    return await store.dispatch('management/request', { url: `${ base }/v2/alerts`, redirectUnauthorized: false }) || [];
  } catch (e) {
    const res = await store.dispatch('management/request', { url: `${ base }/v1/alerts`, redirectUnauthorized: false });

    return res?.data || [];
  }
}

/**
 * Where a Kubernetes object lives in the UI, in the cluster a widget names.
 *
 * The shell's own link formatters route into `clusterId` - the cluster that is OPEN - which on the
 * Home is none and on another cluster's dashboard is the wrong one. This builds the same route
 * against the widget's cluster instead. `kind` + `apiVersion` become the type id the way the
 * shell's InvolvedObjectLink derives it.
 */
export function objectRoute(cluster: string, {
  kind, apiVersion, name, namespace
}: { kind?: string; apiVersion?: string; name?: string; namespace?: string } = {}): RouteLocationRaw | null {
  if (!cluster || !kind || !name) {
    return null;
  }

  const parts = typeof apiVersion === 'string' ? apiVersion.split('/') : [];
  const resource = parts.length > 1 ? `${ parts[0] }.${ kind.toLowerCase() }` : kind.toLowerCase();

  return {
    name:   `c-cluster-product-resource${ namespace ? '-namespace' : '' }-id`,
    params: {
      cluster, product: 'explorer', resource, id: name, ...(namespace ? { namespace } : {})
    },
  };
}

// ---- a cluster's component status ------------------------------------------------------------------

/** The dashboard's own states for a component chip. `loading` is its spinner, while an agent is read. */
export type ServiceState = 'healthy' | 'warning' | 'unhealthy' | 'loading';

/** One chip of the component status row. */
export interface ServiceStatus {
  /** 'etcd', 'scheduler', 'controller-manager', 'cattle' or 'fleet' - the dashboard's own names. */
  name: string;
  state: ServiceState;
  /** An i18n key, or text as it came from the cluster. */
  tooltip?: string;
  tooltipKey?: string;
  /** The deployment behind an agent chip that is not healthy, in the widget's cluster. */
  target?: RouteLocationRaw;
}

// The control-plane components the dashboard reports, from the cluster's own status.
const CLUSTER_COMPONENTS = ['etcd', 'scheduler', 'controller-manager'];

/** A deployment, as much of it as the agent status reads. */
interface RawDeployment {
  metadata?: { name?: string; namespace?: string; state?: { error?: boolean; message?: string } };
  spec?: { replicas?: number };
  status?: { readyReplicas?: number; unavailableReplicas?: number; conditions?: { status?: string }[] };
}

/**
 * Read one agent deployment. null when it is not there, or not readable by this user - the
 * dashboard hides the chip then. 'unreachable' when the cluster itself did not answer, which is
 * what the dashboard means by a disconnected agent.
 */
async function readDeployment(store: Store<unknown>, cluster: string, id: string): Promise<RawDeployment | null | 'unreachable'> {
  try {
    return await store.dispatch('management/request', { url: clusterUrl(cluster, `apps.deployments/${ id }`) });
  } catch (e) {
    const status = (e as { _status?: number })?._status;

    return status === 404 || status === 403 ? null : 'unreachable';
  }
}

/** The dashboard's agent verdict over one or more deployments (see its getAgentStatus). */
function agentStatus(name: string, cluster: string, resources: (RawDeployment | null | 'unreachable')[]): ServiceStatus | null {
  if (resources.length === 1 && resources[0] === null) {
    return null;
  }

  const route = (d: RawDeployment): RouteLocationRaw => ({
    name:   'c-cluster-product-resource-namespace-id',
    params: {
      cluster, product: 'explorer', resource: 'apps.deployment', namespace: d.metadata?.namespace || '', id: d.metadata?.name || ''
    },
  });

  for (const d of resources) {
    if (!d || d === 'unreachable' || d.status?.conditions?.some((c) => c.status !== 'True') || d.metadata?.state?.error) {
      const known = d && d !== 'unreachable' ? d : null;

      return {
        name,
        state:      'unhealthy',
        tooltip:    known?.metadata?.state?.message,
        tooltipKey: known?.metadata?.state?.message ? undefined : 'clusterIndexPage.sections.componentStatus.tooltip.disconnected',
        target:     known ? route(known) : undefined,
      };
    }
  }

  for (const d of resources as RawDeployment[]) {
    if (d.spec?.replicas !== d.status?.readyReplicas || (d.status?.unavailableReplicas || 0) > 0) {
      return {
        name,
        state:      'warning',
        tooltip:    d.metadata?.state?.message,
        tooltipKey: d.metadata?.state?.message ? undefined : 'clusterIndexPage.sections.componentStatus.tooltip.unavailableReplicas',
        target:     route(d),
      };
    }
  }

  return { name, state: 'healthy' };
}

/**
 * The control-plane chips - etcd, the scheduler, the controller manager - from the cluster's own
 * status on its management cluster. Any condition that is not True makes a component unhealthy; a
 * component the status does not mention counts as healthy, as the dashboard counts it.
 */
export async function fetchComponentHealth(store: Store<unknown>, cluster: string): Promise<ServiceStatus[]> {
  const mgmt = await fetchManagementCluster<{ status?: { componentStatuses?: { name: string; conditions?: { status?: string; message?: string }[] }[] } }>(store, cluster);

  return CLUSTER_COMPONENTS.map((name) => {
    const failing = (mgmt?.status?.componentStatuses || [])
      .filter((s) => s.name.startsWith(name))
      .map((s) => (s.conditions || []).find((c) => c.status !== 'True'))
      .find(Boolean);

    return failing ? {
      name, state: 'unhealthy', tooltip: failing.message
    } : { name, state: 'healthy' };
  });
}

/**
 * The agents a cluster's row reports: Rancher's own (cattle) - except on the local cluster, which
 * runs Rancher itself - and Fleet's.
 */
export function expectedAgents(cluster: string): ('cattle' | 'fleet')[] {
  return cluster === 'local' ? ['fleet'] : ['cattle', 'fleet'];
}

/**
 * One agent's chip, from its deployments in the cluster; null when it is not there or not readable,
 * which hides it, as the dashboard hides it.
 *
 * Read on its own, and apart from the control-plane chips, because a cluster whose agent is down
 * takes its time to fail - around thirty seconds here - and nothing else should wait on it. On the
 * local cluster Fleet is the agent AND the controller; the controller alone decides while the agent
 * is still being created, as it can be for a while after Rancher starts.
 */
export async function fetchAgentHealth(store: Store<unknown>, cluster: string, agent: 'cattle' | 'fleet'): Promise<ServiceStatus | null> {
  if (agent === 'cattle') {
    return agentStatus('cattle', cluster, [await readDeployment(store, cluster, 'cattle-system/cattle-cluster-agent')]);
  }

  if (cluster !== 'local') {
    return agentStatus('fleet', cluster, [await readDeployment(store, cluster, 'cattle-fleet-system/fleet-agent')]);
  }

  const [fleetAgent, controller] = await Promise.all([
    readDeployment(store, cluster, 'cattle-fleet-local-system/fleet-agent'),
    readDeployment(store, cluster, 'cattle-fleet-system/fleet-controller'),
  ]);

  return agentStatus('fleet', cluster, fleetAgent ? [fleetAgent, controller] : [controller]);
}
