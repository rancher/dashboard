import {
  buildMonitoringDashboardUrl,
  computeDashboardUrl,
  getDashboardUid,
  getClusterPrefix,
  isGrafanaProxied
} from '@shell/utils/grafana';
import { GRAFANA_DASHBOARDS, resolveDashboardUrl } from '@shell/config/grafana-dashboards';

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

describe('fx: getDashboardUid', () => {
  it('extracts the uid from a direct grafana dashboard url', () => {
    expect(getDashboardUid('https://grafana.example.com/d/rancher-node-1/rancher-node?orgId=1')).toStrictEqual('rancher-node-1');
  });

  it('extracts the uid from a Rancher service proxy grafana url', () => {
    expect(getDashboardUid('/api/v1/namespaces/monitoring/services/http:ext-monitoring-grafana:80/proxy/d/rancher-cluster-1/rancher-cluster?orgId=1')).toStrictEqual('rancher-cluster-1');
  });
});

describe('fx: isGrafanaProxied', () => {
  it('returns false for external grafana urls', () => {
    expect(isGrafanaProxied({ grafanaURL: 'https://grafana.example.com' })).toStrictEqual(false);
  });

  it('returns true for the legacy in-cluster proxy url (relative path)', () => {
    expect(isGrafanaProxied({ grafanaURL: '/api/v1/namespaces/cattle-monitoring-system/services/http:rancher-monitoring-grafana:80/proxy/' })).toStrictEqual(true);
  });

  it('returns true when no grafanaURL is configured', () => {
    expect(isGrafanaProxied({})).toStrictEqual(true);
  });

  it('returns false for absolute URL even if it contains /api/v1/namespaces/', () => {
    expect(isGrafanaProxied({ grafanaURL: 'https://example.com/api/v1/namespaces/test' })).toStrictEqual(false);
  });
});

describe('fx: resolveDashboardUrl', () => {
  it('returns external url when grafanaURL is set', () => {
    const url = resolveDashboardUrl({ grafanaURL: 'https://grafana.example.com/' }, 'NODE_DETAIL');

    expect(url).toStrictEqual('https://grafana.example.com/d/rancher-node-detail-1/rancher-node-detail?orgId=1');
  });

  it('returns proxy fallback url when no grafanaURL is configured', () => {
    const url = resolveDashboardUrl({}, 'NODE_DETAIL');

    expect(url).toStrictEqual(GRAFANA_DASHBOARDS.NODE_DETAIL.proxyUrl);
  });

  it('has entries for all expected dashboard keys', () => {
    const expectedKeys = [
      'CLUSTER_DETAIL', 'CLUSTER_SUMMARY',
      'K8S_DETAIL', 'K8S_SUMMARY',
      'ETCD_DETAIL', 'ETCD_SUMMARY',
      'NODE_DETAIL', 'NODE_SUMMARY',
      'POD_DETAIL', 'POD_SUMMARY',
      'WORKLOAD_DETAIL', 'WORKLOAD_SUMMARY',
    ];

    expectedKeys.forEach((key) => {
      expect(GRAFANA_DASHBOARDS).toHaveProperty(key);
      expect(GRAFANA_DASHBOARDS[key as keyof typeof GRAFANA_DASHBOARDS]).toHaveProperty('uid');
      expect(GRAFANA_DASHBOARDS[key as keyof typeof GRAFANA_DASHBOARDS]).toHaveProperty('slug');
      expect(GRAFANA_DASHBOARDS[key as keyof typeof GRAFANA_DASHBOARDS]).toHaveProperty('proxyUrl');
    });
  });
});
