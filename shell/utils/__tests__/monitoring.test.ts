import { CATALOG, COUNT, SCHEMA } from '@shell/config/types';
import { haveV2Monitoring } from '@shell/utils/monitoring';

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

  it('returns false when neither CRDs nor the monitoring app are present', () => {
    const getters = {
      getStoreNameByProductId: 'cluster',
      'cluster/all':           () => []
    };

    expect(haveV2Monitoring(getters)).toStrictEqual(false);
  });
});
