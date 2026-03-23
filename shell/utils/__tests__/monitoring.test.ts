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
  haveV2Monitoring
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
  type MonitoringLinkFn = (store: MonitoringStore) => Promise<boolean>;

  function createStore(dashboardValues = endpointUrls): MonitoringStore {
    return {
      getters: {
        'cluster/canList':   () => true,
        'cluster/schemaFor': (type: string) => [CONFIG_MAP, ENDPOINTS].includes(type)
      },
      dispatch: jest.fn(async(action: string, payload: { type: string; id?: string }) => {
        if (action === 'cluster/find' && payload.type === CATALOG.APP) {
          return { status: { dashboardValues } };
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

  it('returns dashboard metadata from the ConfigMap when app status is empty', async() => {
    const dashboardValues = {
      ...endpointUrls,
      grafanaURL:        'https://grafana.example.com',
      rancherDashboards: { 'rancher-cluster-1': 'Rancher / Cluster' }
    };
    const store = createStore(dashboardValues);

    store.dispatch.mockImplementationOnce(async() => ({ status: { dashboardValues: {} } }));

    await expect(getClusterMonitoringDashboardValues(store)).resolves.toStrictEqual(dashboardValues);
    expect(store.dispatch).toHaveBeenNthCalledWith(2, 'cluster/find', {
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
