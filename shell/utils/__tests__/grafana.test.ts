import {
  getClusterPrefix,
  computeDashboardUrl,
  dashboardExists,
  queryGrafana,
  hasLeader,
  leaderChanges,
  failedProposals,
} from '@shell/utils/grafana';

import { haveV2Monitoring } from '@shell/utils/monitoring';

jest.mock('@shell/utils/monitoring', () => ({
  haveV2Monitoring:       jest.fn(),
  fetchMonitoringVersion: jest.fn(),
}));

describe('fx: getClusterPrefix', () => {
  it('old monitoring version, downstream cluster', () => {
    const prefix = getClusterPrefix('101.0.0+up19.0.3', 'c-abcd');

    expect(prefix).toStrictEqual('/k8s/clusters/c-abcd');
  });
  it('old monitoring version, local cluster', () => {
    const prefix = getClusterPrefix('101.0.0+up19.0.3', 'local');

    expect(prefix).toStrictEqual('');
  });
  it('new monitoring version, downstream cluster', () => {
    const prefix = getClusterPrefix('102.0.0+up40.1.2', 'c-abcd');

    expect(prefix).toStrictEqual('/k8s/clusters/c-abcd');
  });
  it('new monitoring version, local cluster', () => {
    const prefix = getClusterPrefix('102.0.0+up40.1.2', 'local');

    expect(prefix).toStrictEqual('/k8s/clusters/local');
  });
  it('future monitoring version, downstream cluster', () => {
    const prefix = getClusterPrefix('103.0.0+up41.0.0', 'c-abcd');

    expect(prefix).toStrictEqual('/k8s/clusters/c-abcd');
  });
  it('future monitoring version, local cluster', () => {
    const prefix = getClusterPrefix('103.0.0+up41.0.0', 'local');

    expect(prefix).toStrictEqual('');
  });
  it('empty monitoring version, downstream cluster', () => {
    const prefix = getClusterPrefix('', 'c-abcd');

    expect(prefix).toStrictEqual('/k8s/clusters/c-abcd');
  });
  it('empty monitoring version, local cluster', () => {
    const prefix = getClusterPrefix('', 'local');

    expect(prefix).toStrictEqual('');
  });
});

describe('computeDashboardUrl', () => {
  it('builds url with prefix for downstream cluster, no extra params', () => {
    const result = computeDashboardUrl(
      '101.0.0+up19.0.3',
      'https://rancher.local/d/abc/dashboard?orgId=1',
      'c-m-xyz',
      {}
    );

    expect(result).toContain('/k8s/clusters/c-m-xyz');
    expect(result).toContain('orgId=1');
    expect(result).toContain('kiosk');
    expect(result).toContain('_dash.hideTimePicker=true');
  });

  it('uses empty prefix for local cluster', () => {
    const result = computeDashboardUrl(
      '101.0.0+up19.0.3',
      'https://rancher.local/d/abc/dashboard?orgId=1',
      'local',
      {}
    );

    expect(result).not.toContain('/k8s/clusters/');
  });

  it('appends viewPanel when present in embed url', () => {
    const result = computeDashboardUrl(
      '101.0.0+up19.0.3',
      'https://rancher.local/d/abc/dashboard?orgId=1&viewPanel=5',
      'local',
      {}
    );

    expect(result).toContain('viewPanel=5');
  });

  it('appends extra params from params object', () => {
    const result = computeDashboardUrl(
      '101.0.0+up19.0.3',
      'https://rancher.local/d/abc/dashboard?orgId=1',
      'local',
      { var_cluster: 'my-cluster' }
    );

    expect(result).toContain('var_cluster=my-cluster');
  });

  it('skips prefix when modifyPrefix is false', () => {
    const result = computeDashboardUrl(
      '101.0.0+up19.0.3',
      'https://rancher.local/d/abc/dashboard?orgId=1',
      'c-m-xyz',
      {},
      false
    );

    expect(result).not.toContain('/k8s/clusters/c-m-xyz');
    expect(result).toContain('/d/abc/dashboard');
  });
});

describe('dashboardExists', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns false when v2 monitoring is not available', async() => {
    (haveV2Monitoring as jest.Mock).mockReturnValue(false);
    const store = { getters: {} };

    const result = await dashboardExists('101.0.0', store, 'c-m-xyz', 'https://rancher.local/d/abc/dash?orgId=1');

    expect(result).toStrictEqual(false);
  });

  it('returns true when request succeeds', async() => {
    (haveV2Monitoring as jest.Mock).mockReturnValue(true);
    const store = {
      getters:  {},
      dispatch: jest.fn().mockResolvedValue({ status: 200 }),
    };

    const result = await dashboardExists(
      '101.0.0',
      store,
      'c-m-xyz',
      'https://rancher.local/api/v1/namespaces/cattle-monitoring-system/services/http:rancher-monitoring-grafana:80/proxy/d/abc123/dashboard?orgId=1'
    );

    expect(result).toStrictEqual(true);
    expect(store.dispatch).toHaveBeenCalledWith('cluster/request', expect.objectContaining({ url: expect.stringContaining('api/dashboards/uid/') }));
  });

  it('returns false when request throws', async() => {
    (haveV2Monitoring as jest.Mock).mockReturnValue(true);
    const store = {
      getters:  {},
      dispatch: jest.fn().mockRejectedValue(new Error('not found')),
    };

    const result = await dashboardExists(
      '101.0.0',
      store,
      'c-m-xyz',
      'https://rancher.local/api/v1/namespaces/cattle-monitoring-system/services/http:rancher-monitoring-grafana:80/proxy/d/abc123/dashboard?orgId=1'
    );

    expect(result).toStrictEqual(false);
  });

  it('uses project monitoring url when projectId provided', async() => {
    (haveV2Monitoring as jest.Mock).mockReturnValue(true);
    const store = {
      getters:  {},
      dispatch: jest.fn().mockResolvedValue({ status: 200 }),
    };

    await dashboardExists(
      '101.0.0',
      store,
      'c-m-xyz',
      'https://rancher.local/api/v1/namespaces/cattle-project-p-abc123-monitoring/services/http:cattle-project-p-abc123-monitoring-grafana:80/proxy/d/uid99/dashboard?orgId=1',
      'cluster',
      'p-abc123'
    );

    const dispatchUrl = store.dispatch.mock.calls[0][1].url;

    expect(dispatchUrl).toContain('cattle-project-p-abc123-monitoring');
  });
});

describe('queryGrafana', () => {
  it('dispatches cluster/request with correctly formed url', () => {
    const dispatch = jest.fn().mockResolvedValue({});

    queryGrafana('101.0.0+up19.0.3', dispatch, 'c-m-xyz', 'up', { start: 1000, end: 2000 }, 30);

    expect(dispatch).toHaveBeenCalledWith(
      'cluster/request',
      expect.objectContaining({
        url:                  expect.stringContaining('query=up'),
        redirectUnauthorized: false,
      })
    );
    const calledUrl = dispatch.mock.calls[0][1].url;

    expect(calledUrl).toContain('start=1000');
    expect(calledUrl).toContain('end=2000');
    expect(calledUrl).toContain('step=30');
  });
});

describe('hasLeader', () => {
  it('returns true when etcd leader value is "1"', async() => {
    const dispatch = jest.fn().mockResolvedValue({ data: { result: [{ values: [[0, '1']] }] } });

    const result = await hasLeader('101.0.0', dispatch, 'c-m-xyz');

    expect(result).toStrictEqual(true);
    expect(dispatch).toHaveBeenCalledWith(
      'cluster/request',
      expect.objectContaining({ url: expect.stringContaining('etcd_server_has_leader') })
    );
  });

  it('returns false when etcd leader value is "0"', async() => {
    const dispatch = jest.fn().mockResolvedValue({ data: { result: [{ values: [[0, '0']] }] } });

    const result = await hasLeader('101.0.0', dispatch, 'c-m-xyz');

    expect(result).toStrictEqual(false);
  });

  it('returns false when result is empty', async() => {
    const dispatch = jest.fn().mockResolvedValue({ data: { result: [] } });

    const result = await hasLeader('101.0.0', dispatch, 'c-m-xyz');

    expect(result).toStrictEqual(false);
  });
});

describe('leaderChanges', () => {
  it('returns leader changes count from response', async() => {
    const dispatch = jest.fn().mockResolvedValue({ data: { result: [{ values: [[0, '5']] }] } });

    const result = await leaderChanges('101.0.0', dispatch, 'c-m-xyz');

    expect(result).toStrictEqual('5');
    expect(dispatch).toHaveBeenCalledWith(
      'cluster/request',
      expect.objectContaining({ url: expect.stringContaining('etcd_server_leader_changes_seen_total') })
    );
  });

  it('returns 0 when result is empty', async() => {
    const dispatch = jest.fn().mockResolvedValue({ data: { result: [] } });

    const result = await leaderChanges('101.0.0', dispatch, 'c-m-xyz');

    expect(result).toStrictEqual(0);
  });
});

describe('failedProposals', () => {
  it('returns failed proposals count from response', async() => {
    const dispatch = jest.fn().mockResolvedValue({ data: { result: [{ values: [[0, '3']] }] } });

    const result = await failedProposals('101.0.0', dispatch, 'c-m-xyz');

    expect(result).toStrictEqual('3');
    expect(dispatch).toHaveBeenCalledWith(
      'cluster/request',
      expect.objectContaining({ url: expect.stringContaining('etcd_server_proposals_failed_total') })
    );
  });

  it('returns 0 when result is empty', async() => {
    const dispatch = jest.fn().mockResolvedValue({ data: { result: [] } });

    const result = await failedProposals('101.0.0', dispatch, 'c-m-xyz');

    expect(result).toStrictEqual(0);
  });
});
