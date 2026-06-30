import { shallowMount } from '@vue/test-utils';
import CruGKE from '../CruGKE.vue';

const mockedStore = () => {
  return {
    getters: {
      'i18n/t':                  (text: string) => text,
      t:                         (text: string) => text,
      currentStore:              () => 'current_store',
      'current_store/schemaFor': jest.fn(),
      'current_store/all':       jest.fn(),
      'management/byId':         () => ({ value: '' }),
      'management/schemaFor':    jest.fn(),
      'auth/principalId':        'local://test',
    },
    dispatch: jest.fn(() => Promise.resolve({
      gkeConfig:      {},
      name:           '',
      importedConfig: { privateRegistryURL: null },
      annotations:    {}
    }))
  };
};

const requiredSetup = (isImport = false) => {
  return {
    global: {
      mocks: {
        $store:      mockedStore(),
        $route:      { query: { mode: isImport ? 'import' : '' } },
        $fetchState: { pending: false },
      },
      stubs: { CruResource: { template: '<div><slot /></div>' } }
    }
  };
};

describe('CruGKE', () => {
  it('renders the registries section when importing an existing cluster', () => {
    const wrapper = shallowMount(CruGKE, {
      propsData: { value: { isImported: true }, mode: 'create' },
      data:      () => ({ isAuthenticated: true }),
      ...requiredSetup(false)
    });

    expect(wrapper.find('[data-testid="registries-accordion"]').exists()).toBe(true);
  });

  it('renders the registries section when provisioning a new cluster', () => {
    const wrapper = shallowMount(CruGKE, {
      propsData: { value: { isImported: false }, mode: 'create' },
      data:      () => ({ isAuthenticated: true }),
      ...requiredSetup(false)
    });

    expect(wrapper.find('[data-testid="registries-accordion"]').exists()).toBe(true);
  });
});
