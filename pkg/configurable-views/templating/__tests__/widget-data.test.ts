import type { Store } from 'vuex';
import {
  applyFilter, applySort, expectedAgents, fetchAlerts, fetchMonitoring, fetchStateSummaries, fieldValue, objectRoute, parseFilter,
  steveFilters, summarizeCounts
} from '@pkg/configurable-views/templating/widget-data';
import type { ResourceRow } from '@pkg/configurable-views/templating/types';

const row = (name: string, extra: Partial<ResourceRow> = {}): ResourceRow => ({
  metadata: {
    name, namespace: 'default', labels: { env: name.startsWith('prod') ? 'prod' : 'dev' }
  },
  ...extra
});

// A store whose management/request answers by the PATH asked for (query aside): a value, or an
// Error to reject with. Anything else is a 404.
function storeAnswering(answers: Record<string, unknown>) {
  const dispatch = jest.fn((_action: string, { url }: { url: string }) => {
    const key = Object.keys(answers).find((k) => url.split('?')[0].endsWith(k));
    const answer = key ? answers[key] : new Error(`404 ${ url }`);

    return answer instanceof Error ? Promise.reject(answer) : Promise.resolve(answer);
  });

  return { store: { dispatch } as unknown as Store<unknown>, dispatch };
}

describe('filters', () => {
  it('reads comma-separated clauses, a bare word being a name search', () => {
    expect(parseFilter('state != Active, env==prod, web')).toStrictEqual([
      {
        field: 'state', op: '!=', value: 'Active'
      },
      {
        field: 'env', op: '=', value: 'prod'
      },
      {
        field: 'name', op: 'contains', value: 'web'
      },
    ]);
    expect(parseFilter('')).toStrictEqual([]);
  });

  it('keeps the rows matching every clause', () => {
    const rows = [row('prod-web'), row('prod-db'), row('dev-web')];

    expect(applyFilter(rows, 'label:env = prod, web').map((r) => r.metadata?.name)).toStrictEqual(['prod-web']);
    expect(applyFilter(rows, 'name != dev-web')).toHaveLength(2);
    expect(applyFilter(rows, '')).toBe(rows);
  });

  it('compares numbers as numbers, and never matches a comparison on text', () => {
    const rows = [row('a', { spec: { replicas: 3 } }), row('b', { spec: { replicas: 12 } })];

    expect(applyFilter(rows, 'spec.replicas > 5').map((r) => r.metadata?.name)).toStrictEqual(['b']);
    expect(applyFilter(rows, 'metadata.name > 5')).toStrictEqual([]);
  });

  it('pushes a filter to the API only when the API can apply all of it', () => {
    expect(steveFilters('')).toStrictEqual([]);
    expect(steveFilters('name=web, namespace != kube-system')).toHaveLength(2);
    // Provider is worked out by the dashboard, so there is no field to ask the API about.
    expect(steveFilters('name=web, provider=k3s')).toBeNull();
    // Steve does not compare.
    expect(steveFilters('created > 2024')).toBeNull();
  });
});

describe('reading and sorting', () => {
  it('reads a known field, a dotted path, or a label', () => {
    const r = row('prod-web', { nameDisplay: 'Web', spec: { nodeName: 'n1' } });

    expect(fieldValue(r, 'name')).toBe('Web');
    expect(fieldValue(r, 'spec.nodeName')).toBe('n1');
    expect(fieldValue(r, 'labels.env')).toBe('prod');
    expect(fieldValue(r, 'spec.missing')).toBe('');
    expect(fieldValue(null, 'name')).toBe('');
  });

  it('sorts numbers as numbers and text as text, either way', () => {
    const rows = [row('b', { spec: { n: 10 } }), row('a', { spec: { n: 9 } }), row('C', { spec: { n: 100 } })];

    expect(applySort(rows, 'spec.n').map((r) => r.metadata?.name)).toStrictEqual(['a', 'b', 'C']);
    expect(applySort(rows, 'metadata.name', 'desc').map((r) => r.metadata?.name)).toStrictEqual(['C', 'b', 'a']);
    expect(applySort(rows, '')).toBe(rows);
  });
});

describe('cluster counts', () => {
  it('splits a type into useful, warning and error by state', () => {
    const counts = { pod: { summary: { count: 10, states: { error: 2, active: 3 } } } };

    expect(summarizeCounts(counts, 'pod')).toStrictEqual({
      total: 10, useful: 8, warningCount: 0, errorCount: 2
    });
    expect(summarizeCounts(counts, 'missing')).toStrictEqual({
      total: 0, useful: 0, warningCount: 0, errorCount: 0
    });
  });

  it('expects no Rancher agent on the local cluster', () => {
    expect(expectedAgents('local')).toStrictEqual(['fleet']);
    expect(expectedAgents('c-m-1')).toStrictEqual(['cattle', 'fleet']);
  });
});

describe('objectRoute', () => {
  it('links into the named cluster, not the open one', () => {
    expect(objectRoute('c-m-1', {
      kind: 'Pod', apiVersion: 'v1', name: 'web', namespace: 'default'
    })).toStrictEqual({
      name:   'c-cluster-product-resource-namespace-id',
      params: {
        cluster: 'c-m-1', product: 'explorer', resource: 'pod', id: 'web', namespace: 'default'
      },
    });
  });

  it('names a grouped type by its group, and a cluster-scoped one without a namespace', () => {
    expect(objectRoute('c-m-1', {
      kind: 'Deployment', apiVersion: 'apps/v1', name: 'web', namespace: 'default'
    })).toStrictEqual(expect.objectContaining({ params: expect.objectContaining({ resource: 'apps.deployment' }) }));
    expect(objectRoute('c-m-1', { kind: 'Node', name: 'n1' })).toStrictEqual(expect.objectContaining({ name: 'c-cluster-product-resource-id' }));
  });

  it('has nowhere to go without a cluster, a kind or a name', () => {
    expect(objectRoute('', { kind: 'Pod', name: 'web' })).toBeNull();
    expect(objectRoute('c-m-1', { name: 'web' })).toBeNull();
  });
});

describe('reading a named cluster', () => {
  it("asks each type's state summary of that cluster, keeping a failed type apart", async() => {
    const summary = [{ property: 'metadata.state.name', counts: { running: { total: 2, namespace: { default: 2 } } } }];
    const { store, dispatch } = storeAnswering({ '/k8s/clusters/c-m-1/v1/pod': { summary } });

    const result = await fetchStateSummaries(store, 'c-m-1', ['pod', 'apps.deployment']);

    expect(result[0]).toStrictEqual({
      type: 'pod', summary, error: null
    });
    expect(result[1].summary).toBeNull();
    expect(result[1].error).toMatch(/404/);
    expect(dispatch.mock.calls[0][1].url).toBe('/k8s/clusters/c-m-1/v1/pod?summary=metadata.state.name&summaryonly&summarynamespaced');
  });

  it("finds a cluster's monitoring and its version, or says it has none", async() => {
    const app = { metadata: { name: 'rancher-monitoring' }, spec: { chart: { metadata: { version: '110.0.2' } } } };

    expect(await fetchMonitoring(storeAnswering({ 'cattle-monitoring-system/rancher-monitoring': app }).store, 'c-m-1')).toStrictEqual({ installed: true, version: '110.0.2' });
    expect(await fetchMonitoring(storeAnswering({}).store, 'c-m-1')).toStrictEqual({ installed: false, version: '' });
  });

  it("reads a cluster's alerts from Alertmanager, falling back to its older API", async() => {
    const alert = { labels: { alertname: 'Watchdog' } };

    expect(await fetchAlerts(storeAnswering({ '/api/v2/alerts': [alert] }).store, 'c-m-1')).toStrictEqual([alert]);
    expect(await fetchAlerts(storeAnswering({ '/api/v1/alerts': { data: [alert] } }).store, 'c-m-1')).toStrictEqual([alert]);
  });
});
