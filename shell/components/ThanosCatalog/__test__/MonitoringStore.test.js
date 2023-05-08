import MonitoringStore from '@shell/components/ThanosCatalog/MonitoringStore.vue';
import { set } from '@shell/utils/object';

const address = '0.0.0.0';

describe('global monitorning MonitoringStore methods: initOtherClusterStores', () => {
  it('otherClusterStores should be null', () => {
    const localThis = { query: { stores: [] } };

    MonitoringStore.methods.initOtherClusterStores.call(localThis);
    expect(localThis.query.otherClusterStores).toHaveLength(0);
  });

  it('otherClusterStores should be null 2', () => {
    const localThis = { $set: set, query: { stores: [address], enabledClusterStores: [{ address }] } };

    MonitoringStore.methods.initOtherClusterStores.call(localThis);
    expect(localThis.query.otherClusterStores).toHaveLength(0);
  });

  it('should be filter the enabled stores', () => {
    const localThis = { $set: set, query: { stores: [address], enabledClusterStores: [] } };

    MonitoringStore.methods.initOtherClusterStores.call(localThis);
    expect(localThis.query.otherClusterStores).toHaveLength(1);
  });
});

describe('global monitorning MonitoringStore methods: updateClusterStore', () => {
  it('enabledClusterStores and  stores were successfully updated', () => {
    const query = { stores: [], otherClusterStores: ['1.1.1.1'] };
    const localThis = {
      $set:     set,
      clusters: [{
        monitoringEabled: true,
        clusterStore:     address,
      }],
      value: { thanos: { query } },
      query,
    };

    MonitoringStore.methods.updateClusterStore.call(localThis);
    expect(localThis.query.stores).toHaveLength(2);
    expect(localThis.query.enabledClusterStores).toHaveLength(1);
  });
});
