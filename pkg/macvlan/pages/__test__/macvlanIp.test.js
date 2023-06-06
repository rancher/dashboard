import { shallowMount } from '@vue/test-utils';
import MacvlanIp from '../macvlanIp.vue';
import ResourceFetch from '@shell/mixins/resource-fetch';
import ResourceTable from '@shell/components/ResourceTable.vue';

describe('component: macvlan', () => {
  it('should load the headers for the macvlanIp', () => {
    const headerKeys = ['name', 'subnet', 'namespace', 'address', 'ipType', 'mac', 'podId', 'workload'];
    const resource = '';
    const wrapper = shallowMount(MacvlanIp, {
      components: { ResourceTable },
      mixins:     [ResourceFetch],
      mocks:      {
        $store: {
          dispatch: () => jest.fn(),
          getters:  {
            'management/byId':            () => jest.fn(),
            'prefs/get':                  () => resource,
            'resource-fetch/refreshFlag': () => resource,
          }
        },
        $fetchState: {
          pending: false, error: true, timestamp: Date.now()
        },
        // $route: { params: { resource } },
      },
    });

    expect(wrapper.vm.headers.map(item => item.name)).toStrictEqual(headerKeys);
  });

  it('methods: get workload name1 normal', () => {
    const localThis = { disabledEncryption: { value: 'true' } };
    const metadata = {
      labels: { 'workload.user.cattle.io/workloadselector': 'apps.deployment-default-test' },
      name:   'test-6fc968cc8b-4sphl',
    };

    const workloadName = MacvlanIp.methods.getWorkloadName.call(
      localThis,
      metadata.name,
      metadata.labels['workload.user.cattle.io/workloadselector']
    );

    expect(workloadName).toBe('test');
  });

  it('methods: get workload name2', () => {
    const localThis = { disabledEncryption: { value: 'true' } };
    const metadata = {
      name:   '',
      labels: { 'workload.user.cattle.io/workloadselector': 'apps.deployment-default-test' }
    };

    const workloadName = MacvlanIp.methods.getWorkloadName.call(
      localThis,
      metadata.name,
      metadata.labels['workload.user.cattle.io/workloadselector']
    );

    expect(workloadName).toBe('');
  });

  it('methods: get workload name3', () => {
    const localThis = { disabledEncryption: { value: 'true' } };
    const metadata = {
      name:   'apps-default-test-11234',
      labels: { 'workload.user.cattle.io/workloadselector': 'apps-default-test' }
    };

    const workloadName = MacvlanIp.methods.getWorkloadName.call(
      localThis,
      metadata.name,
      metadata.labels['workload.user.cattle.io/workloadselector']
    );

    expect(workloadName).toBe('apps-default-test');
  });
});
