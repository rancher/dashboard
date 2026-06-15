import {
  haveV2Monitoring,
  canViewGrafanaLink,
  canViewAlertManagerLink,
  canViewPrometheusLink,
  CATTLE_MONITORING_NAMESPACE,
} from '@shell/utils/monitoring';
import { MONITORING, SCHEMA, ENDPOINTS } from '@shell/config/types';

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

describe('cATTLE_MONITORING_NAMESPACE', () => {
  it('equals cattle-monitoring-system', () => {
    expect(CATTLE_MONITORING_NAMESPACE).toStrictEqual('cattle-monitoring-system');
  });
});

function makeStore(endpointId: string, subsets: object[] | undefined, hasSchema = true) {
  return {
    getters:  { 'cluster/schemaFor': (type: string) => (type === ENDPOINTS ? (hasSchema ? {} : null) : null) },
    dispatch: jest.fn().mockResolvedValue(
      subsets !== undefined ? [{ id: endpointId, subsets }] : []
    ),
  };
}

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
