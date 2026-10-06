import type { Store } from 'vuex';
import {
  expectedAgents, fetchAlerts, fetchMonitoring, fetchStateSummaries, objectRoute, summarizeCounts
} from '@pkg/configurable-views/templating/widget-data';

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
