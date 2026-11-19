import {
  monitoringStatus,
  haveV2Monitoring,
  fetchMonitoringApp,
  fetchMonitoringVersion,
  hasEndpointSubsets,
  canViewGrafanaLink,
  canViewAlertManagerLink,
  canViewPrometheusLink,
  CATTLE_MONITORING_NAMESPACE,
} from '@shell/utils/monitoring';
import { MONITORING, SCHEMA, ENDPOINTS, CATALOG } from '@shell/config/types';

const PODMONITOR_ID = MONITORING.PODMONITOR.toLowerCase();

function makeGetters(storeName: string, schemas: object[]) {
  return {
    getStoreNameByProductId: storeName,
    [`${ storeName }/all`]:  (type: string) => (type === SCHEMA ? schemas : []),
  };
}

describe('haveV2Monitoring', () => {
  it('returns true when podmonitor schema exists', () => {
    const getters = makeGetters('cluster', [{ id: PODMONITOR_ID }]);

    expect(haveV2Monitoring(getters)).toBe(true);
  });

  it('returns false when no schemas exist', () => {
    const getters = makeGetters('cluster', []);

    expect(haveV2Monitoring(getters)).toBe(false);
  });

  it('returns false when schemas exist but not podmonitor', () => {
    const getters = makeGetters('cluster', [{ id: 'apps.deployment' }, { id: 'v1.pod' }]);

    expect(haveV2Monitoring(getters)).toBe(false);
  });

  it('returns true when podmonitor is among multiple schemas', () => {
    const getters = makeGetters('cluster', [
      { id: 'apps.deployment' },
      { id: PODMONITOR_ID },
      { id: 'v1.pod' },
    ]);

    expect(haveV2Monitoring(getters)).toBe(true);
  });

  it('uses the store name from getStoreNameByProductId getter', () => {
    const getters = makeGetters('mgmt', [{ id: PODMONITOR_ID }]);

    expect(haveV2Monitoring(getters)).toBe(true);
  });
});

describe('monitoringStatus', () => {
  it.each([
    ['with', [{ id: PODMONITOR_ID }], { v2: true, installed: true }],
    ['without', [], { v2: false, installed: false }],
  ])('should report monitoring %s the podmonitor schema', (_, schemas, expected) => {
    const { monitoringStatus: computed } = monitoringStatus();

    expect(computed.call({ $store: { getters: makeGetters('cluster', schemas) } })).toStrictEqual(expected);
  });
});

const DASHBOARDS_APP_ID = `${ CATTLE_MONITORING_NAMESPACE }/rancher-monitoring-dashboards`;
const LEGACY_APP_ID = `${ CATTLE_MONITORING_NAMESPACE }/rancher-monitoring`;

function makeAppStore(apps: Record<string, object | null>, canList = true, storeName = 'cluster') {
  return {
    getters:  { [`${ storeName }/canList`]: (type: string) => canList && type === CATALOG.APP },
    dispatch: jest.fn((action: string, { id }: { id: string }) => (id in apps ? Promise.resolve(apps[id]) : Promise.reject(new Error('not found')))),
  };
}

describe('fetchMonitoringApp', () => {
  it('should not look up any app when the user cannot list apps', async() => {
    const store = makeAppStore({ [DASHBOARDS_APP_ID]: { id: DASHBOARDS_APP_ID } }, false);

    expect(await fetchMonitoringApp(store, 'cluster')).toBeNull();
    expect(store.dispatch).toHaveBeenCalledTimes(0);
  });

  it('should prefer the rancher-monitoring-dashboards app', async() => {
    const app = { id: DASHBOARDS_APP_ID };
    const store = makeAppStore({ [DASHBOARDS_APP_ID]: app, [LEGACY_APP_ID]: { id: LEGACY_APP_ID } });

    expect(await fetchMonitoringApp(store, 'cluster')).toStrictEqual(app);
    expect(store.dispatch).toHaveBeenCalledTimes(1);
    expect(store.dispatch).toHaveBeenCalledWith('cluster/find', { type: CATALOG.APP, id: DASHBOARDS_APP_ID });
  });

  it.each([
    ['is not found', {}],
    ['resolves empty', { [DASHBOARDS_APP_ID]: null }],
  ])('should fall back to the rancher-monitoring app when the dashboards app %s', async(_, apps) => {
    const app = { id: LEGACY_APP_ID };
    const store = makeAppStore({ ...apps, [LEGACY_APP_ID]: app });

    expect(await fetchMonitoringApp(store, 'cluster')).toStrictEqual(app);
    expect(store.dispatch).toHaveBeenCalledWith('cluster/find', { type: CATALOG.APP, id: LEGACY_APP_ID });
  });

  it('should return null when neither app is installed', async() => {
    const store = makeAppStore({});

    expect(await fetchMonitoringApp(store, 'cluster')).toBeNull();
    expect(store.dispatch).toHaveBeenCalledTimes(2);
  });

  it('should look up the apps in the given store', async() => {
    const store = makeAppStore({ [DASHBOARDS_APP_ID]: { id: DASHBOARDS_APP_ID } }, true, 'harvester');

    await fetchMonitoringApp(store, 'harvester');

    expect(store.dispatch).toHaveBeenCalledWith('harvester/find', { type: CATALOG.APP, id: DASHBOARDS_APP_ID });
  });
});

describe('fetchMonitoringVersion', () => {
  it('should return the installed app version', async() => {
    const store = makeAppStore({ [DASHBOARDS_APP_ID]: { id: DASHBOARDS_APP_ID, currentVersion: '108.0.0+up77.9.1' } });

    expect(await fetchMonitoringVersion(store, 'cluster')).toStrictEqual('108.0.0+up77.9.1');
  });

  it('should return an empty version when no app is installed', async() => {
    const store = makeAppStore({});

    expect(await fetchMonitoringVersion(store, 'cluster')).toStrictEqual('');
  });
});

describe('cATTLE_MONITORING_NAMESPACE', () => {
  it('equals cattle-monitoring-system', () => {
    expect(CATTLE_MONITORING_NAMESPACE).toStrictEqual('cattle-monitoring-system');
  });
});

function makeStore(endpointId: string, subsets: object[] | undefined, hasSchema = true, storeName = 'cluster') {
  return {
    getters:  { [`${ storeName }/schemaFor`]: (type: string) => (type === ENDPOINTS ? (hasSchema ? {} : null) : null) },
    dispatch: jest.fn().mockResolvedValue(
      subsets !== undefined ? [{ id: endpointId, subsets }] : []
    ),
  };
}

describe('hasEndpointSubsets', () => {
  it('should only list the endpoints in the namespace of the id, from the given store', async() => {
    const id = 'cattle-project-p-abc123-monitoring/cattle-project-p-abc123-monitoring-grafana';
    const store = makeStore(id, [{ addresses: [{ ip: '10.0.0.4' }] }], true, 'harvester');

    expect(await hasEndpointSubsets(store, id, 'harvester')).toStrictEqual(true);
    expect(store.dispatch).toHaveBeenCalledWith('harvester/findAll', { type: ENDPOINTS, opt: { namespaced: 'cattle-project-p-abc123-monitoring' } });
  });

  it.each([
    ['resolves empty', (store: ReturnType<typeof makeStore>) => store.dispatch.mockResolvedValue(undefined)],
    ['fails', (store: ReturnType<typeof makeStore>) => store.dispatch.mockRejectedValue(new Error('403 Forbidden'))],
  ])('should return false when listing the endpoints %s', async(_, mockList) => {
    const id = `${ CATTLE_MONITORING_NAMESPACE }/rancher-monitoring-grafana`;
    const store = makeStore(id, undefined);

    mockList(store);

    expect(await hasEndpointSubsets(store, id)).toStrictEqual(false);
  });

  it('should return false when the endpoint is missing', async() => {
    const store = makeStore('other/endpoint', [{ addresses: [{ ip: '10.0.0.4' }] }]);

    expect(await hasEndpointSubsets(store, `${ CATTLE_MONITORING_NAMESPACE }/rancher-monitoring-grafana`)).toStrictEqual(false);
  });
});

describe('canViewGrafanaLink', () => {
  it('returns true when grafana endpoint has subsets', async() => {
    const id = `${ CATTLE_MONITORING_NAMESPACE }/rancher-monitoring-grafana`;
    const store = makeStore(id, [{ addresses: [{ ip: '10.0.0.1' }] }]);

    expect(await canViewGrafanaLink(store)).toBe(true);
  });

  it('returns false when grafana endpoint has empty subsets', async() => {
    const id = `${ CATTLE_MONITORING_NAMESPACE }/rancher-monitoring-grafana`;
    const store = makeStore(id, []);

    expect(await canViewGrafanaLink(store)).toBe(false);
  });

  it('returns falsy when grafana endpoint is not found', async() => {
    const store = makeStore('other/endpoint', [{ addresses: [] }]);

    expect(await canViewGrafanaLink(store)).toBeFalsy();
  });

  it('returns false when endpoints schema is not available', async() => {
    const id = `${ CATTLE_MONITORING_NAMESPACE }/rancher-monitoring-grafana`;
    const store = makeStore(id, [{ addresses: [] }], false);

    expect(await canViewGrafanaLink(store)).toBe(false);
    expect(store.dispatch).not.toHaveBeenCalled();
  });
});

describe('canViewAlertManagerLink', () => {
  it('returns true when alertmanager endpoint has subsets', async() => {
    const id = `${ CATTLE_MONITORING_NAMESPACE }/rancher-monitoring-alertmanager`;
    const store = makeStore(id, [{ addresses: [{ ip: '10.0.0.2' }] }]);

    expect(await canViewAlertManagerLink(store)).toBe(true);
  });

  it('returns falsy when alertmanager endpoint has no subsets', async() => {
    const id = `${ CATTLE_MONITORING_NAMESPACE }/rancher-monitoring-alertmanager`;
    const store = makeStore(id, undefined);

    expect(await canViewAlertManagerLink(store)).toBeFalsy();
  });
});

describe('canViewPrometheusLink', () => {
  it('returns true when prometheus endpoint has subsets', async() => {
    const id = `${ CATTLE_MONITORING_NAMESPACE }/rancher-monitoring-prometheus`;
    const store = makeStore(id, [{ addresses: [{ ip: '10.0.0.3' }] }]);

    expect(await canViewPrometheusLink(store)).toBe(true);
  });

  it('returns falsy when prometheus endpoint has no subsets', async() => {
    const id = `${ CATTLE_MONITORING_NAMESPACE }/rancher-monitoring-prometheus`;
    const store = makeStore(id, undefined);

    expect(await canViewPrometheusLink(store)).toBeFalsy();
  });
});
