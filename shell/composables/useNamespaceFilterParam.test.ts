import { defineComponent, h, nextTick, reactive } from 'vue';
import { shallowMount } from '@vue/test-utils';
import { useNamespaceFilterParam } from '@shell/composables/useNamespaceFilterParam';
import stevePaginationUtils from '@shell/plugins/steve/steve-pagination-utils';
import { NAMESPACE } from '@shell/config/types';
import { ALL_NAMESPACES } from '@shell/store/prefs';

const mockGetters: Record<string, any> = reactive({});

jest.mock('vuex', () => ({ useStore: () => ({ getters: mockGetters }) }));

jest.mock('@shell/plugins/steve/steve-pagination-utils', () => ({
  __esModule: true,
  default:    {
    createParamsFromNsFilter:  jest.fn(() => ({ projectsOrNamespaces: ['default'], filters: [] })),
    createParamsForPagination: jest.fn(() => 'page=1&pagesize=100&projectsornamespaces=default&'),
  },
}));

const namespaces = [{ id: 'default' }];
const schemas: Record<string, { id: string }> = { pod: { id: 'pod' }, 'apps.deployment': { id: 'apps.deployment' } };

function setupGetters(overrides: Record<string, any> = {}) {
  Object.keys(mockGetters).forEach((key) => delete mockGetters[key]);
  Object.assign(mockGetters, {
    namespaceFilters:    ['ns://default'],
    isAllNamespaces:     false,
    currentCluster:      { isLocal: true },
    currentProduct:      { hideSystemResources: true },
    'prefs/get':         (key: string) => key === ALL_NAMESPACES,
    'cluster/all':       (type: string) => (type === NAMESPACE ? namespaces : []),
    'cluster/schemaFor': (type: string) => schemas[type],
    ...overrides,
  });
}

function mountComposable(types: string[] = ['pod']) {
  let param: ReturnType<typeof useNamespaceFilterParam>;

  const wrapper = shallowMount(defineComponent({
    setup() {
      param = useNamespaceFilterParam(types);

      return {};
    },
    render: () => h('div'),
  }));

  return {
    wrapper,
    get param() {
      return param!;
    },
  };
}

describe('composable: useNamespaceFilterParam', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupGetters();
  });

  it('should build the params from the namespace filter state', () => {
    const { wrapper } = mountComposable();

    expect(stevePaginationUtils.createParamsFromNsFilter).toHaveBeenCalledWith({
      allNamespaces:                 namespaces,
      selection:                     ['ns://default'],
      isAllNamespaces:               false,
      isLocalCluster:                true,
      showReservedRancherNamespaces: true,
      productHidesSystemNamespaces:  true,
    });
    wrapper.unmount();
  });

  it('should use the first type that has a schema', () => {
    const { wrapper } = mountComposable(['missing.type', 'apps.deployment', 'pod']);

    expect(stevePaginationUtils.createParamsForPagination).toHaveBeenCalledWith({
      schema: schemas['apps.deployment'],
      opt:    {
        pagination: {
          filters: [], projectsOrNamespaces: ['default'], page: 1, sort: []
        }
      },
    });
    wrapper.unmount();
  });

  it('should leave out the page params and the trailing ampersand', () => {
    const { wrapper, param } = mountComposable();

    expect(param.value).toStrictEqual('projectsornamespaces=default');
    wrapper.unmount();
  });

  it('should be empty when there is nothing to filter', () => {
    jest.mocked(stevePaginationUtils.createParamsForPagination).mockReturnValueOnce(undefined);
    const { wrapper, param } = mountComposable();

    expect(param.value).toStrictEqual('');
    wrapper.unmount();
  });

  it('should update when the namespace filter changes', async() => {
    const { wrapper, param } = mountComposable();

    jest.mocked(stevePaginationUtils.createParamsForPagination).mockReturnValueOnce('page=1&projectsornamespaces=kube-system');
    mockGetters.namespaceFilters = ['ns://kube-system'];
    await nextTick();

    expect(param.value).toStrictEqual('projectsornamespaces=kube-system');
    wrapper.unmount();
  });
});
