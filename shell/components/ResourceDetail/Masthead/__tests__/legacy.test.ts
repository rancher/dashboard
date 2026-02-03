import { shallowMount } from '@vue/test-utils';
import Legacy from '@shell/components/ResourceDetail/Masthead/legacy.vue';
import { useRuntimeFlag } from '@shell/composables/useRuntimeFlag';

jest.mock('@shell/composables/useRuntimeFlag', () => ({ useRuntimeFlag: jest.fn() }));

describe('component: Masthead/legacy', () => {
  const mockStore = {
    getters: {
      currentStore:          () => 'cluster',
      'cluster/schemaFor':   jest.fn(),
      'prefs/dev':           false,
      productId:             'product',
      'type-map/labelFor':   jest.fn(),
      'type-map/optionsFor': jest.fn(),
      currentProduct:        { name: 'product' },
      'prefs/get':           jest.fn(),
      'management/byId':     jest.fn(),
      currentCluster:        { id: 'cluster-id' },
    },
    commit:   jest.fn(),
    dispatch: jest.fn(),
  };

  const mocks = {
    $store:  mockStore,
    $route:  { params: { cluster: 'c-cluster', product: 'product' } },
    $router: { applyQuery: jest.fn() },
    t:       jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRuntimeFlag as jest.Mock).mockReturnValue({ featureDropdownMenu: false });
  });

  it('should return fallback schema with ID when the schema is missing (e.g. virtual types)', () => {
    const resource = 'projectsecret';

    mockStore.getters['cluster/schemaFor'].mockReturnValue(undefined);

    const wrapper = shallowMount(Legacy, {
      props: {
        resource,
        value: { metadata: { name: 'test' } },
        mode:  'create'
      },
      global: { mocks }
    });

    expect(wrapper.vm.schema).toStrictEqual({ id: resource });
  });

  it('should return actual schema if it exists', () => {
    const resource = 'secret';
    const mockSchema = { id: 'secret', attributes: { kind: 'Secret' } };

    mockStore.getters['cluster/schemaFor'].mockReturnValue(mockSchema);

    const wrapper = shallowMount(Legacy, {
      props: {
        resource,
        value: { metadata: { name: 'test' } },
        mode:  'create'
      },
      global: { mocks }
    });

    expect(wrapper.vm.schema).toStrictEqual(mockSchema);
  });
});
