import { shallowMount } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import CruGKE from '../CruGKE.vue';

const mockedStore = () => {
  return {
    getters: {
      'i18n/t':               (text: string) => text,
      t:                      (text: string) => text,
      currentStore:           () => 'current_store',
      'management/byId':      () => ({ value: '' }),
      'management/schemaFor': jest.fn(),
      'auth/principalId':     'local://test',
    },
    dispatch: jest.fn((_action: string, resource: any) => {
      // Mimic rancher/create: return the resource payload as-is
      return Promise.resolve({ ...resource });
    })
  };
};

describe('CruGKE', () => {
  it('renders the registries section when importing an existing cluster', async() => {
    const store = mockedStore();

    const wrapper = shallowMount(CruGKE, {
      propsData: { value: {}, mode: 'create' },
      global:    {
        mocks: {
          $store:      store,
          $route:      { query: { mode: 'import' } },
          $fetchState: { pending: false },
        },
        stubs: { CruResource: { template: '<div><slot /></div>' } }
      }
    });

    await wrapper.vm.$options.fetch.call(wrapper.vm);
    await flushPromises();
    wrapper.vm.isAuthenticated = true;
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.normanCluster.importedConfig).toBeDefined();
    expect(wrapper.find('[data-testid="registries-accordion"]').exists()).toBe(true);
  });

  it('renders the registries section when provisioning a new cluster', async() => {
    const store = mockedStore();

    const wrapper = shallowMount(CruGKE, {
      propsData: { value: {}, mode: 'create' },
      global:    {
        mocks: {
          $store:      store,
          $route:      { query: {} },
          $fetchState: { pending: false },
        },
        stubs: { CruResource: { template: '<div><slot /></div>' } }
      }
    });

    await wrapper.vm.$options.fetch.call(wrapper.vm);
    await flushPromises();
    wrapper.vm.isAuthenticated = true;
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.normanCluster.importedConfig).toBeDefined();
    expect(wrapper.find('[data-testid="registries-accordion"]').exists()).toBe(true);
  });
});
