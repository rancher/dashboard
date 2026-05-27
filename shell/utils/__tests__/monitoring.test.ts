import {
  CATALOG,
  CONFIG_MAP,
  COUNT,
  ENDPOINTS,
  SCHEMA
} from '@shell/config/types';
import {
  canViewAlertManagerLink,
  canViewGrafanaLink,
  canViewPrometheusLink,
  getClusterMonitoringDashboardValues,
  getConfigMapMonitoringDashboardValues,
  haveV2Monitoring,
  isDashboardOnlyMode
} from '@shell/utils/monitoring';

describe('fx: haveV2Monitoring', () => {
  it('returns true when monitoring CRDs are available', () => {
    const getters = {
      getStoreNameByProductId: 'cluster',
      'cluster/all':           (type: string) => {
        if (type === SCHEMA) {
          return [{ id: 'monitoring.coreos.com.podmonitor' }];
        }

        if (type === COUNT) {
          return [{ counts: {} }];
        }

        return [];
      }
    };

    expect(haveV2Monitoring(getters)).toStrictEqual(true);
  });

  it('returns true when rancher-monitoring is installed without monitoring CRDs', () => {
    const getters = {
      getStoreNameByProductId: 'cluster',
      'cluster/all':           (type: string) => {
        if (type === SCHEMA) {
          return [];
        }

        if (type === COUNT) {
          return [{ counts: { [CATALOG.APP]: { namespaces: { 'cattle-monitoring-system': 1 } } } }];
        }

        return [];
      }
    };

    expect(haveV2Monitoring(getters)).toStrictEqual(true);
  });

  it('returns true when the monitoring app has already been loaded', () => {
    const getters = {
      getStoreNameByProductId: 'cluster',
      'cluster/all':           (type: string) => {
        if (type === CATALOG.APP) {
          return [{ id: 'cattle-monitoring-system/rancher-monitoring' }];
        }

        if (type === COUNT) {
          return [{ counts: {} }];
        }

        return [];
      }
    };

    expect(haveV2Monitoring(getters)).toStrictEqual(true);
  });

  it('returns false when neither CRDs nor the monitoring app are present', () => {
    const getters = {
      getStoreNameByProductId: 'cluster',
      'cluster/all':           () => []
    };

    expect(haveV2Monitoring(getters)).toStrictEqual(false);
  });
});

describe('fx: canView monitoring links', () => {
  const endpointUrls = {
    grafanaURL:      '',
    alertmanagerURL: '',
    prometheusURL:   ''
  };

  type MonitoringStore = {
    getters: {
      'cluster/canList': () => boolean;
      'cluster/schemaFor': (type: string) => boolean;
    };
    dispatch: jest.Mock<Promise<any>, [string, { type: string; id?: string }]>;
  };
  type MonitoringLinkFn = (store: MonitoringStore, dashboardValues?: Record<string, string>) => Promise<boolean>;

  function createStore(dashboardValues = endpointUrls, appId = 'cattle-monitoring-system/rancher-monitoring'): MonitoringStore {
    return {
      getters: {
        'cluster/canList':   () => true,
        'cluster/schemaFor': (type: string) => [CONFIG_MAP, ENDPOINTS].includes(type)
      },
      dispatch: jest.fn(async(action: string, payload: { type: string; id?: string }) => {
        if (action === 'cluster/find' && payload.type === CATALOG.APP) {
          if (payload.id === appId) {
            return { status: { dashboardValues } };
          }
          throw new Error('not found');
        }

        if (action === 'cluster/find' && payload.type === CONFIG_MAP) {
          return { data: { 'values.json': JSON.stringify(dashboardValues) } };
        }

        if (action === 'cluster/findAll' && payload.type === ENDPOINTS) {
          return [];
        }

        return null;
      })
    };
  }

  it.each([
    ['grafanaURL', canViewGrafanaLink],
    ['alertmanagerURL', canViewAlertManagerLink],
    ['prometheusURL', canViewPrometheusLink]
  ] as [keyof typeof endpointUrls, MonitoringLinkFn][])('returns true when %s is published in dashboard metadata', async(key, fn) => {
    const store = createStore({
      ...endpointUrls,
      [key]: `https://${ key }.example.com`
    });

    await expect(fn(store)).resolves.toStrictEqual(true);
    expect(store.dispatch).toHaveBeenCalledWith('cluster/find', {
      type: CATALOG.APP,
      id:   'cattle-monitoring-system/rancher-monitoring'
    });
  });

  it('discovers dashboard metadata from rancher-monitoring-dashboards app', async() => {
    const dashboardValues = {
      ...endpointUrls,
      grafanaURL: 'https://grafana.example.com'
    };
    const store = createStore(dashboardValues, 'cattle-monitoring-system/rancher-monitoring-dashboards');

    const result = await canViewGrafanaLink(store);

    expect(result).toStrictEqual(true);
    expect(store.dispatch).toHaveBeenCalledWith('cluster/find', {
      type: CATALOG.APP,
      id:   'cattle-monitoring-system/rancher-monitoring'
    });
    expect(store.dispatch).toHaveBeenCalledWith('cluster/find', {
      type: CATALOG.APP,
      id:   'cattle-monitoring-system/rancher-monitoring-dashboards'
    });
  });

  it('returns dashboard metadata from the ConfigMap when app status is empty', async() => {
    const dashboardValues = {
      ...endpointUrls,
      grafanaURL:        'https://grafana.example.com',
      rancherDashboards: { 'rancher-cluster-1': 'Rancher / Cluster' }
    };
    const store = createStore(dashboardValues);

    // Both app lookups return empty dashboardValues
    store.dispatch.mockImplementation(async(action: string, payload: { type: string; id?: string }) => {
      if (action === 'cluster/find' && payload.type === CATALOG.APP) {
        throw new Error('not found');
      }

      if (action === 'cluster/find' && payload.type === CONFIG_MAP) {
        return { data: { 'values.json': JSON.stringify(dashboardValues) } };
      }

      return null;
    });

    await expect(getClusterMonitoringDashboardValues(store)).resolves.toStrictEqual(dashboardValues);
    expect(store.dispatch).toHaveBeenCalledWith('cluster/find', {
      type: CONFIG_MAP,
      id:   'cattle-monitoring-system/rancher-monitoring-dashboard-values'
    });
  });
});

describe('fx: getConfigMapMonitoringDashboardValues', () => {
  it('returns parsed dashboard metadata from values.json', () => {
    const configMap = {
      data: {
        'values.json': JSON.stringify({
          grafanaURL:        'https://grafana.example.com',
          rancherDashboards: { 'rancher-node-1': 'Rancher / Node' }
        })
      }
    };

    expect(getConfigMapMonitoringDashboardValues(configMap)).toStrictEqual({
      grafanaURL:        'https://grafana.example.com',
      rancherDashboards: { 'rancher-node-1': 'Rancher / Node' }
    });
  });
});

describe('fx: isDashboardOnlyMode', () => {
  it('returns true when only grafanaURL is configured', () => {
    expect(isDashboardOnlyMode({ grafanaURL: 'https://grafana.example.com' })).toStrictEqual(true);
  });

  it('returns false when all URLs are configured', () => {
    expect(isDashboardOnlyMode({
      grafanaURL:      'https://grafana.example.com',
      prometheusURL:   'https://prometheus.example.com',
      alertmanagerURL: 'https://alertmanager.example.com'
    })).toStrictEqual(false);
  });

  it('returns false when no URLs are configured', () => {
    expect(isDashboardOnlyMode({})).toStrictEqual(false);
  });

  it('returns false when grafanaURL is empty', () => {
    expect(isDashboardOnlyMode({ grafanaURL: '' })).toStrictEqual(false);
  });
});

describe('fx: canViewGrafanaLink with pre-fetched dashboardValues', () => {
  const endpointUrls = {
    grafanaURL:      '',
    alertmanagerURL: '',
    prometheusURL:   ''
  };

  function createStore() {
    return {
      getters: {
        'cluster/canList':   () => true,
        'cluster/schemaFor': (type: string) => [ENDPOINTS].includes(type)
      },
      dispatch: jest.fn(async(action: string, payload: { type: string; id?: string }) => {
        if (action === 'cluster/findAll' && payload.type === ENDPOINTS) {
          return [];
        }

        return null;
      })
    };
  }

  it('uses pre-fetched dashboardValues without calling getClusterMonitoringDashboardValues', async() => {
    const store = createStore();
    const dashboardValues = {
      ...endpointUrls,
      grafanaURL: 'https://grafana.example.com'
    };

    const result = await canViewGrafanaLink(store, dashboardValues);

    expect(result).toStrictEqual(true);
    expect(store.dispatch).not.toHaveBeenCalledWith('cluster/find', expect.anything());
  });

  it('falls back to endpoint check when dashboardValues has no URL', async() => {
    const store = createStore();
    const dashboardValues = { ...endpointUrls };

    const result = await canViewGrafanaLink(store, dashboardValues);

    expect(result).toStrictEqual(false);
  });
});
