import Import from '@shell/edit/provisioning.cattle.io.cluster/import.vue';
import PrivateRegistry from '@shell/edit/provisioning.cattle.io.cluster/PrivateRegistry.vue';
import { shallowMount } from '@vue/test-utils';

describe('component: provisioning.cattle.io.cluster/import', () => {
  it('should contain PrivateRegistry component', () => {
    const wrapper = shallowMount(Import, {
      propsData: {
        mode:     'create',
        value:    {},
        provider: 'import'
      },
      computed: {
        hideDescriptions() {
          return [];
        }
      },
      mocks: {
        $fetchState: { pending: false },
        $store:      {
          getters: {
            'management/schemaFor': jest.fn(),
            'prefs/get':            jest.fn(),
            'features/get':         jest.fn()
          },
        },
      },
    });

    expect(wrapper.findComponent(PrivateRegistry).exists()).toBe(true);
  });
});
