// What a widget SHOWS, worked out from its spec — shared by every widget renderer so a filter or a
// column means the same thing whichever building block you dropped.
//
// One idea runs through the whole file: a widget names fields the way a person would ("state",
// "provider", "K8s version"), not the way the API stores them. FIELDS maps those names onto a
// resource, and anything not in the map falls through to a dotted path (`spec.nodeName`), so any
// CRD still works without being taught here.
//
// Pure functions — no Vue. `rows` are Steve/Norman resource instances.

import { get } from '@shell/utils/object';
import { parseSi, formatSi, createMemoryFormat, createMemoryValues } from '@shell/utils/units';
import { PaginationParamFilter } from '@shell/types/store/pagination.types';
import { MANAGEMENT, METRIC, NODE } from '@shell/config/types';
import { NODE_ROLES } from '@shell/config/labels-annotations';
import { colorForState } from '@shell/plugins/dashboard-store/resource-class';
import { colorToCountName } from '@shell/components/ResourceSummary';
import { RESOURCES as DASHBOARD_RESOURCES } from '@shell/pages/c/_cluster/explorer/index.vue';

/**
 * The fields a widget can filter, sort, group and tabulate on. `value` reads one off a row; `label`
 * is what the settings dialog and the table header call it.
 *
 * Order matters — it is the order the Columns checkboxes appear in.
 */
export const FIELDS = [
  {
    id: 'state', label: 'State', value: (row) => row.stateDisplay || row.state || ''
  },
  {
    id: 'name', label: 'Name', value: (row) => row.nameDisplay || get(row, 'metadata.name') || row.name || ''
  },
  {
    id: 'provider', label: 'Provider', value: (row) => providerOf(row)
  },
  {
    id: 'version', label: 'K8s version', value: (row) => versionOf(row)
  },
  {
    id: 'nodes', label: 'Nodes', value: (row) => nodeCountOf(row)
  },
  {
    id: 'cpu', label: 'CPU', value: (row) => cpuOf(row)
  },
  {
    id: 'memory', label: 'Memory', value: (row) => memoryOf(row)
  },
  {
    id: 'pods', label: 'Pods', value: (row) => podsOf(row)
  },
  {
    id: 'created', label: 'Created', value: (row) => get(row, 'metadata.creationTimestamp') || ''
  },
  {
    id: 'namespace', label: 'Namespace', value: (row) => get(row, 'metadata.namespace') || ''
  },
  {
    id: 'type', label: 'Type', value: (row) => typeOf(row)
  },
  {
    id: 'message', label: 'Message', value: (row) => row.message || get(row, 'status.message') || ''
  },
];

const FIELD_BY_ID = FIELDS.reduce((acc, f) => {
  acc[f.id] = f;

  return acc;
}, {});

/** The columns a table offers — every field that makes sense in a column, in FIELDS order. */
export const TABLE_COLUMNS = FIELDS;

/** A field's human label ('K8s version'), falling back to the raw path for a CRD field. */
export function fieldLabel(id) {
  return FIELD_BY_ID[id]?.label || id;
}

// ---- per-resource readers ----------------------------------------------------------------------
// Rancher spreads the same idea over several shapes (a provisioning cluster, a management cluster,
// a node). These read whichever one the row actually is, and return '' when it is neither.

// How Rancher writes the distros in its own tables. Anything else (an imported or local cluster)
// has no distro to name, so only the provider is shown.
const DISTROS = {
  rke2: 'RKE2', k3s: 'K3s', rke: 'RKE', k3s1: 'K3s'
};

function providerOf(row) {
  const provider = row.machineProviderDisplay || row.machineProvider || row.provider ||
    get(row, 'status.provider') || get(row, 'mgmt.status.provider') || '';
  const distro = DISTROS[`${ row.provisioner || row.kubernetesDistro || '' }`.toLowerCase()] || '';

  if (provider && distro) {
    return `${ distro } · ${ provider }`;
  }

  return provider || distro || '';
}

function versionOf(row) {
  return row.kubernetesVersion ||
    get(row, 'spec.kubernetesVersion') ||
    get(row, 'status.version.gitVersion') ||
    get(row, 'mgmt.status.version.gitVersion') ||
    get(row, 'status.kubernetesVersion') ||
    '';
}

function nodeCountOf(row) {
  const nodes = Number(get(row, 'status.nodeCount') ?? get(row, 'mgmt.status.nodeCount'));

  return Number.isFinite(nodes) && nodes > 0 ? nodes : '';
}

function cpuOf(row) {
  const cpu = get(row, 'status.allocatable.cpu') ?? get(row, 'mgmt.status.allocatable.cpu');

  if (cpu === undefined || cpu === null) {
    return '';
  }

  const cores = Math.round(parseSi(cpu));

  // A cluster still coming up reports 0 — it has no CPU to report yet, which is not "0 cores".
  return Number.isFinite(cores) && cores > 0 ? `${ cores } cores` : '';
}

function memoryOf(row) {
  const memory = get(row, 'status.allocatable.memory') ?? get(row, 'mgmt.status.allocatable.memory');

  if (memory === undefined || memory === null) {
    return '';
  }

  const bytes = parseSi(memory);

  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '';
  }

  const format = createMemoryFormat(bytes);

  return formatSi(bytes, format);
}

// An Event's `type` is its severity (Normal / Warning); on most other resources `type` is the Steve
// type id ("provisioning.cattle.io.cluster"), which is the same for every row and so says nothing.
// Only the former is worth showing.
function typeOf(row) {
  const type = `${ row.type || '' }`;

  return type.includes('.') ? '' : type;
}

function podsOf(row) {
  const pods = Number(get(row, 'status.allocatable.pods') ?? get(row, 'mgmt.status.allocatable.pods'));

  return Number.isFinite(pods) && pods > 0 ? `${ pods }` : '';
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
export function storeForType(getters, type) {
  if (!type) {
    return 'management';
  }

  const stores = ['management', getters['currentStore'](type), 'cluster'];

  return stores.find((store) => store && getters[`${ store }/schemaFor`]?.(type)) || 'management';
}

// ---- a type's own columns -----------------------------------------------------------------------

/**
 * The columns Rancher itself defines for a type, via its type-map.
 *
 * This matters because the columns worth showing are a property of the RESOURCE, not of this
 * extension: a Cluster has a provider and a Kubernetes version, a User has a username and a last
 * login, and a CRD has whatever its own list page declares. A fixed list of generic fields can only
 * ever be wrong for most types.
 *
 * Returns `{ id, label, sortable, header }` per column, where `header` is Rancher's real header
 * definition — pass it to a table verbatim and the column gets its proper formatter and value.
 */
export function typeColumns(getters, resource) {
  if (!resource) {
    return [];
  }

  const schema = getters[`${ storeForType(getters, resource) }/schemaFor`]?.(resource);

  if (!schema) {
    return [];
  }

  const headers = getters['type-map/headersFor']?.(schema) || [];

  return headers.map((header) => ({
    id:       header.name,
    label:    header.labelKey ? getters['i18n/t'](header.labelKey) : (header.label || header.name),
    sortable: !!header.sort,
    header,
  // A type can declare an ACTION column: Rancher's cluster list ends with `explorer`, a 65px column
  // labelled ' ' that exists only so a row can slot its Explore button into it. There is nothing to
  // show and nothing to name, so it is not a column anyone can pick — a blank label is the tell.
  })).filter((column) => column.label.trim());
}

/**
 * Rancher's header, minus the link into the resource's detail page.
 *
 * That link needs a cluster context the Home does not have, and without one it renders an empty
 * cell — the stock Home's own cluster table drops the same formatter for the same reason.
 */
export function withoutDetailLink(header) {
  if (header?.formatter !== 'LinkDetail') {
    return header;
  }

  const { formatter, ...rest } = header;

  return rest;
}

// ---- reading a field ----------------------------------------------------------------------------

/**
 * One field off one row. A known field id uses its reader; anything else is treated as a dotted
 * path, so `spec.nodeName` or a CRD's own field works with no extra plumbing. A leading `label:`
 * (or `labels.`) reads a Kubernetes label instead.
 */
export function fieldValue(row, field) {
  if (!row || !field) {
    return '';
  }

  if (FIELD_BY_ID[field]) {
    return FIELD_BY_ID[field].value(row) ?? '';
  }

  const label = field.match(/^(?:label:|labels\.)(.+)$/);

  if (label) {
    return get(row, 'metadata.labels')?.[label[1]] ?? '';
  }

  return get(row, field) ?? '';
}

// ---- filtering ----------------------------------------------------------------------------------

const OPERATORS = ['>=', '<=', '!=', '==', '=', '>', '<'];

/**
 * Parse a filter expression into clauses. Written the way the hint describes it — "Labels or
 * fields, such as env=prod or state != Active" — so several clauses are comma separated and ALL
 * must match:
 *
 *   state != Active, env=prod          → [{ field: 'state', op: '!=', value: 'Active' }, …]
 *   prod                               → [{ field: '', op: 'contains', value: 'prod' }]
 *
 * A bare word with no operator matches the row's name.
 */
export function parseFilter(expression) {
  return `${ expression || '' }`
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const op = OPERATORS.find((candidate) => part.includes(candidate));

      if (!op) {
        return {
          field: 'name', op: 'contains', value: part
        };
      }

      const at = part.indexOf(op);

      return {
        field: part.slice(0, at).trim(),
        op:    op === '==' ? '=' : op,
        value: part.slice(at + op.length).trim(),
      };
    });
}

function clauseMatches(row, clause) {
  const actual = fieldValue(row, clause.field);
  const a = `${ actual }`.trim().toLowerCase();
  const b = `${ clause.value }`.trim().toLowerCase();

  switch (clause.op) {
  case 'contains':
    return a.includes(b);
  case '!=':
    return a !== b;
  case '>':
  case '<':
  case '>=':
  case '<=': {
    const left = parseFloat(actual);
    const right = parseFloat(clause.value);

    if (Number.isNaN(left) || Number.isNaN(right)) {
      return false;
    }

    return clause.op === '>' ? left > right : clause.op === '<' ? left < right : clause.op === '>=' ? left >= right : left <= right;
  }
  default:
    return a === b;
  }
}

/** Keep the rows matching EVERY clause of a filter expression (no filter keeps everything). */
export function applyFilter(rows, expression) {
  const clauses = parseFilter(expression);

  if (!clauses.length) {
    return rows;
  }

  return (rows || []).filter((row) => clauses.every((clause) => clauseMatches(row, clause)));
}

// ---- sorting & grouping -------------------------------------------------------------------------

/** Sort rows by a field. Numbers compare as numbers, everything else as lower-cased text. */
export function applySort(rows, field, dir = 'asc') {
  if (!field) {
    return rows;
  }

  const sign = dir === 'desc' ? -1 : 1;

  return [...(rows || [])].sort((a, b) => {
    const left = fieldValue(a, field);
    const right = fieldValue(b, field);
    const ln = parseFloat(left);
    const rn = parseFloat(right);

    if (!Number.isNaN(ln) && !Number.isNaN(rn) && `${ ln }` === `${ left }`.trim() && `${ rn }` === `${ right }`.trim()) {
      return (ln - rn) * sign;
    }

    return `${ left }`.toLowerCase().localeCompare(`${ right }`.toLowerCase()) * sign;
  });
}

/**
 * Count rows per distinct value of a field, biggest group first — what the counters, the status
 * summary and the bar chart all draw. Empty values are grouped under "Unknown".
 */
export function groupRows(rows, field) {
  const counts = new Map();

  (rows || []).forEach((row) => {
    const key = `${ fieldValue(row, field) }`.trim() || 'Unknown';

    counts.set(key, (counts.get(key) || 0) + 1);
  });

  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

/**
 * The colour a state reads as, reusing Rancher's own state colours so a widget agrees with the rest
 * of the product. Falls back to the neutral "info" colour for anything unrecognized.
 */
export function stateColor(label) {
  const key = `${ label }`.toLowerCase();

  if (['active', 'running', 'healthy', 'ready', 'bound', 'completed', 'succeeded', 'attached'].includes(key)) {
    return 'success';
  }
  if (['error', 'failed', 'critical', 'unavailable', 'expired', 'notready', 'not ready', 'detached'].includes(key)) {
    return 'error';
  }
  if (['warning', 'degraded', 'updating', 'upgrading', 'pending', 'provisioning', 'waiting', 'unknown'].includes(key)) {
    return 'warning';
  }

  return 'info';
}

// ---- downstream clusters -------------------------------------------------------------------------
// A Kubernetes type does not exist once. It exists once PER CLUSTER, behind that cluster's own Steve
// API at /k8s/clusters/<id>/v1. The management store can address it directly — give findPage the
// url and `transient: true` and it returns properly classed models (a Pod with its real state and
// name) without caching them, which matters: two clusters' pods would otherwise collide in the
// store under the same type.

// The names a table sorts by in the BROWSER are not the names Steve sorts by. A pod's Name column
// sorts on `nameSort`, a computed property that exists only in the dashboard; ask the API for it and
// it answers 422 "column is invalid" and the whole page fails. These are the few that have a real
// field behind them.
const STEVE_SORT = {
  nameSort:          'metadata.name',
  namespace:         'metadata.namespace',
  stateSort:         'metadata.state.name',
  creationTimestamp: 'metadata.creationTimestamp',
};

// What Steve will sort any type by, on top of whatever that type's own schema declares.
const STEVE_SORT_ALWAYS = ['metadata.name', 'metadata.namespace', 'id', 'metadata.state.name', 'metadata.creationTimestamp'];

/**
 * The field Steve can sort this column by, or null if it cannot.
 *
 * Returning null is the point: a sort the API rejects fails the REQUEST, so an untranslatable
 * column has to mean "ask unsorted" rather than "ask and break".
 */
export function steveSortField(getters, resource, column) {
  if (!column) {
    return null;
  }

  const schema = getters[`${ storeForType(getters, resource) }/schemaFor`]?.(resource);
  const header = (getters['type-map/headersFor']?.(schema) || []).find((h) => h.name === column);
  const raw = Array.isArray(header?.sort) ? header.sort[0] : (header?.sort || column);
  const field = STEVE_SORT[`${ raw }`.split(':')[0]] || `${ raw }`.split(':')[0];

  if (STEVE_SORT_ALWAYS.includes(field)) {
    return field;
  }

  // The schema lists the columns the API indexes, as JSONPath — `$.spec.nodeName` is `spec.nodeName`.
  const known = (schema?.attributes?.columns || []).some(
    (c) => `${ c.field }`.replace('$.', '').replace('[', '.').replace(']', '') === field
  );

  return known ? field : null;
}

/**
 * The field Steve FILTERS each of our field names on, where it can filter it at all.
 *
 * Short on purpose. Everything here is stored on the object, so the API can compare it. The rest of
 * FIELDS - provider, version, cpu, memory, pods - is computed by Rancher's model from several
 * places at once, so no field path exists to ask the API about, and no amount of mapping invents
 * one.
 */
const STEVE_FILTER = {
  name:      'metadata.name',
  namespace: 'metadata.namespace',
  state:     'metadata.state.name',
  created:   'metadata.creationTimestamp',
};

/** The operators Steve understands. A comparison is arithmetic, and Steve does not do arithmetic. */
const STEVE_OPS = ['=', '!=', 'contains'];

/**
 * A widget's filter expression as filters the API can apply, or null if it cannot apply it.
 *
 * ALL of it, or none of it. A filter half-pushed is the worst of the three outcomes: the API
 * returns a page narrowed by one clause, the other clause is applied to that page, and rows that
 * match sit on page two forever without appearing anywhere. So an expression with a single clause
 * the API cannot answer is refused here, and the caller keeps the whole-collection path it already
 * has - slower, and correct.
 *
 * Returns [] for no filter at all, which is not the same as null: nothing to push, still pushable.
 */
export function steveFilters(expression) {
  const clauses = parseFilter(expression);
  const out = [];

  for (const clause of clauses) {
    const field = STEVE_FILTER[clause.field];

    if (!field || !STEVE_OPS.includes(clause.op)) {
      return null;
    }

    out.push(PaginationParamFilter.createSingleField({
      field,
      value:  clause.value,
      // `contains` is a partial match, which is what `exact: false` means to Steve.
      exact:  clause.op !== 'contains',
      equals: clause.op !== '!=',
    }));
  }

  return out;
}

/** Every cluster the user can see, as picker options, by the name a person would recognise. */
export function clusterOptions(getters) {
  const clusters = getters['management/all']?.('management.cattle.io.cluster') || [];

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
 * A filter the API can apply goes into the request as `filters` (see steveFilters), and the page
 * that comes back is already narrowed - still one request per page.
 *
 * A filter it CANNOT apply is the exception. That one is applied here, so filtering one page of ten
 * would search ten rows and call the rest absent. Such a widget passes `filtered`, asks for up to
 * `cap` rows, and filters and pages what came back; `truncated` says when the cluster had more,
 * because a total that quietly stops being a total is worse than a visible limit.
 */
export async function fetchClusterPage(store, {
  resource, cluster, page = 1, pageSize = 10, sortBy, sortDir, filters = [], filtered = false, cap = 500
}) {
  if (!resource || !cluster) {
    return {
      rows: [], count: 0, truncated: false, serverPaged: false
    };
  }

  const field = steveSortField(store.getters, resource, sortBy);
  const sort = field ? [{ field, asc: sortDir !== 'desc' }] : [];
  const res = await store.dispatch('management/findPage', {
    type: resource,
    opt:  {
      url:        `/k8s/clusters/${ encodeURIComponent(cluster) }/v1/${ resource }`,
      transient:  true,
      watch:      false,
      pagination: filtered ? {
        page: 1, pageSize: cap, sort
      } : {
        page, pageSize, sort, filters
      },
    },
  });

  const count = res?.pagination?.result?.count ?? res?.data?.length ?? 0;

  return {
    rows:        res?.data || [],
    count:       filtered ? (res?.data?.length ?? 0) : count,
    truncated:   filtered && count > cap,
    serverPaged: !filtered,
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
export function fetchManagementCluster(store, cluster) {
  return store.dispatch('management/find', { type: MANAGEMENT.CLUSTER, id: cluster });
}

// A header and a row of cards for the same cluster both want its counts, at the same moment. One
// request answers both: an answer is kept for a few seconds, and a request still in flight is
// shared rather than repeated. Short on purpose - this is de-duplication, not a cache to go stale.
const SHARED_MS = 5000;
const shared = new Map();

function once(key, load) {
  const hit = shared.get(key);

  if (hit && Date.now() - hit.at < SHARED_MS) {
    return hit.promise;
  }

  const promise = load().catch((e) => {
    shared.delete(key);
    throw e;
  });

  shared.set(key, { at: Date.now(), promise });

  return promise;
}

function clusterUrl(cluster, path) {
  return `/k8s/clusters/${ encodeURIComponent(cluster) }/v1/${ path }`;
}

/** Every type's count in one cluster, as Steve summarises them - `{ <type>: { summary } }`. */
export function fetchClusterCounts(store, cluster) {
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
export function summarizeCounts(counts, resource) {
  const summary = counts?.[resource]?.summary || {};
  const out = {
    total: summary.count || 0, useful: summary.count || 0, warningCount: 0, errorCount: 0
  };

  Object.entries(summary.states || {}).forEach(([state, count]) => {
    out.useful -= count;
    out[colorToCountName(colorForState(state))] += count;
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
export function totalCounts(getters, counts) {
  const present = Object.keys(counts || {});
  const picked = present.filter((id) => getters['type-map/isIgnored']({ id }));
  const types = [...new Set([...picked, ...DASHBOARD_RESOURCES])].filter((id) => present.includes(id));

  return types.reduce((acc, id) => {
    const one = summarizeCounts(counts, id);

    Object.keys(acc).forEach((k) => {
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
export async function fetchClusterCapacity(store, cluster) {
  const req = (url) => store.dispatch('management/request', { url });
  const [mgmtCluster, nodesRes, mgmtNodesRes, metricsRes] = await Promise.all([
    fetchManagementCluster(store, cluster),
    req(clusterUrl(cluster, `${ NODE }?pagesize=100000`)),
    req(`/v1/${ MANAGEMENT.NODE }/${ encodeURIComponent(cluster) }?pagesize=100000`).catch(() => null),
    // No metrics server, no live usage - which the dashboard also simply leaves out.
    req(clusterUrl(cluster, `${ METRIC.NODE }?pagesize=100000`)).catch(() => null),
  ]);

  const nodes = nodesRes?.data || [];
  const workerByName = Object.fromEntries((mgmtNodesRes?.data || []).map((m) => [m.status?.nodeName, !!m.spec?.worker]));
  const isWorker = (n) => (n.metadata?.name in workerByName ? workerByName[n.metadata.name] : `${ n.metadata?.labels?.[NODE_ROLES.WORKER] }` === 'true');
  const schedulable = nodes.filter((n) => !n.spec?.unschedulable);
  const workers = schedulable.filter(isWorker);

  const requests = (n) => JSON.parse(n.metadata?.annotations?.['management.cattle.io/pod-requests'] || '{}');
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

  const status = mgmtCluster?.status || {};
  const byNodes = workers.length > 0;

  const pods = byNodes ? { total: agg.podCapacity, useful: agg.podReserved } : { total: parseSi(status.allocatable?.pods || '0'), useful: parseSi(status.requested?.pods || '0') };
  const cores = byNodes ? { total: agg.cpuAllocatable, useful: agg.cpuReserved } : { total: parseSi(status.allocatable?.cpu), useful: parseSi(status.requested?.cpu) };
  const memory = byNodes ? createMemoryValues(agg.ramAllocatable, agg.ramReserved) : createMemoryValues(status.allocatable?.memory, status.requested?.memory);

  // Usage only over the nodes counted above - the workers, or every schedulable node without them.
  const counted = new Set((byNodes ? workers : schedulable).map((n) => n.metadata?.name));
  const metrics = (metricsRes?.data || []).filter((m) => counted.has(m.metadata?.name));
  let cpuUsed = null;
  let ramUsed = null;

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
