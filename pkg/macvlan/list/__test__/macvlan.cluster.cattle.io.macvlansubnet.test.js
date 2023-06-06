import { shallowMount } from '@vue/test-utils';
import Macvlan from '../macvlan.cluster.cattle.io.macvlansubnet.vue';
import ResourceFetch from '@shell/mixins/resource-fetch';
import ResourceTable from '@shell/components/ResourceTable.vue';

describe('component: macvlan', () => {
  it('should load the headers for the macvlan', () => {
    const headerKeys = ['name', 'project', 'master', 'vlan', 'cidr', 'ipRange', 'customRoute', 'gateway'];
    const resource = 'macvlan.cluster.cattle.io.macvlansubnet';
    const wrapper = shallowMount(Macvlan, {
      propsData:  { schema: {}, resource: 'macvlan' },
      components: { ResourceTable },
      mixins:     [ResourceFetch],
      mocks:      {
        $store: {
          dispatch: () => jest.fn(),
          getters:  {
            'management/byId':            () => jest.fn(),
            'prefs/get':                  () => resource,
            'resource-fetch/refreshFlag': () => jest.fn(),
          }
        },
        $fetchState: {
          pending: false, error: true, timestamp: Date.now()
        },
        $route: { params: { resource } },
      },
    });

    expect(wrapper.vm.headers.map(item => item.name)).toStrictEqual(headerKeys);
  });
});
