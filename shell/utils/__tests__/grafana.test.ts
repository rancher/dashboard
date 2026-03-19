import {
  buildMonitoringDashboardUrl,
  canProxyGrafanaQueries,
  computeDashboardUrl,
  getClusterPrefix
} from '@shell/utils/grafana';

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

describe('fx: computeDashboardUrl', () => {
  it('preserves the full external grafana url when prefix modification is disabled', () => {
    const url = computeDashboardUrl('', 'https://grafana.example.com/d/rancher-cluster-1/rancher-cluster?orgId=1', 'local', { 'var-cluster': 'local' }, false);

    expect(url).toStrictEqual('https://grafana.example.com/d/rancher-cluster-1/rancher-cluster?orgId=1&kiosk&_dash.hideTimePicker=true&var-cluster=local');
  });
});

describe('fx: buildMonitoringDashboardUrl', () => {
  it('builds dashboard urls from dashboardValues.grafanaURL when present', () => {
    const url = buildMonitoringDashboardUrl({ grafanaURL: 'https://grafana.example.com/' }, 'rancher-node-1', 'rancher-node', '/fallback');

    expect(url).toStrictEqual('https://grafana.example.com/d/rancher-node-1/rancher-node?orgId=1');
  });

  it('falls back to the legacy in-cluster grafana proxy url when dashboardValues are absent', () => {
    const url = buildMonitoringDashboardUrl({}, 'rancher-node-1', 'rancher-node', '/fallback');

    expect(url).toStrictEqual('/fallback');
  });
});

describe('fx: canProxyGrafanaQueries', () => {
  it('returns false for external grafana urls', () => {
    expect(canProxyGrafanaQueries({ grafanaURL: 'https://grafana.example.com' })).toStrictEqual(false);
  });

  it('returns true for the legacy in-cluster proxy url', () => {
    expect(canProxyGrafanaQueries({ grafanaURL: '/api/v1/namespaces/cattle-monitoring-system/services/http:rancher-monitoring-grafana:80/proxy/' })).toStrictEqual(true);
  });
});
