import { shallowMount } from '@vue/test-utils';
import ResourceList from '@shell/components/ResourceList/index.vue';

jest.mock('@shell/composables/useStateColor', () => ({ useStateColor: () => ({ toStateColor: (state: string) => `${ state }-color` }) }));

jest.mock('@shell/mixins/resource-fetch', () => ({
  __esModule: true,
  default:    {
    data() {
      return {
        forceUpdateLiveAndDelayed:  0,
        loading:                    false,
        rows:                       [],
        namespaceFilterRequired:    false,
        paginationNsFilterRequired: false,
        canPaginate:                false,
        isFirstLoad:                true,
        paginationResult:           null,
        perfConfig:                 {},
      };
    },
    computed: {
      namespaceFilter() {
        return null;
      },
      pagination() {
        return null;
      },
    },
    methods: {
      async $fetchType() {},
      calcCanPaginate() {
        return false;
      },
      paginationChanged() {},
    },
  },
}));

type StoreOpts = {
  schema?: any;
  canList?: boolean;
};

const createStore = ({ schema, canList = true }: StoreOpts) => ({
  getters: {
    'i18n/t':                 (key: string, args: any) => `${ key }-${ JSON.stringify(args ?? {}) }`,
    currentStore:             () => 'cluster',
    'cluster/schemaFor':      () => schema,
    'cluster/all':            () => [],
    'cluster/canList':        () => canList,
    'type-map/hasCustomList': () => false,
    'type-map/optionsFor':    () => ({ showListMasthead: false }),
    'type-map/headersFor':    () => [],
    'type-map/groupByFor':    () => null,
    'type-map/importList':    () => ({}),
  },
  dispatch: jest.fn(),
});

const createWrapper = (store: any) => {
  return shallowMount(ResourceList as any, {
    global: {
      mocks: {
        $store: store,
        $route: { params: { resource: 'bogus-resource-type' }, query: {} },
        t:      (key: string, args: any) => `${ key }-${ JSON.stringify(args ?? {}) }`,
      },
      stubs: {
        FailWhale:      true,
        ResourceTable:  true,
        Masthead:       true,
        ExtensionPanel: true,
        IconMessage:    true,
        Loading:        true,
      },
    },
  });
};

describe('component: ResourceList', () => {
  it('renders the in-context FailWhale (not the list) when the resource type has no schema', async() => {
    const store = createStore({ schema: undefined, canList: true });
    const wrapper = createWrapper(store);

    // fetch() is a Nuxt option and is not run by the test harness, so invoke it directly
    await (wrapper.vm.$options as any).fetch.call(wrapper.vm);
    await wrapper.vm.$nextTick();

    expect((wrapper.vm as any).resourceNotFoundError).toBeInstanceOf(Error);
    expect(wrapper.findComponent({ name: 'FailWhale' }).exists()).toBe(true);
    expect(wrapper.findComponent({ name: 'ResourceTable' }).exists()).toBe(false);
    // Must NOT redirect to the global fail-whale page
    expect(store.dispatch).not.toHaveBeenCalledWith('loadingError', expect.anything());
  });

  it('renders the in-context FailWhale when the resource type cannot be listed', () => {
    const store = createStore({ schema: { id: 'bogus-resource-type' }, canList: false });
    const wrapper = createWrapper(store);

    expect((wrapper.vm as any).resourceNotFoundError).toBeInstanceOf(Error);
    expect(wrapper.findComponent({ name: 'FailWhale' }).exists()).toBe(true);
    expect(store.dispatch).not.toHaveBeenCalledWith('loadingError', expect.anything());
  });

  it('renders the list (no FailWhale) for a valid, listable resource type', async() => {
    const store = createStore({ schema: { id: 'bogus-resource-type' }, canList: true });
    const wrapper = createWrapper(store);

    await (wrapper.vm.$options as any).fetch.call(wrapper.vm);
    await wrapper.vm.$nextTick();

    expect((wrapper.vm as any).resourceNotFoundError).toBeNull();
    expect(wrapper.findComponent({ name: 'FailWhale' }).exists()).toBe(false);
    expect(wrapper.findComponent({ name: 'ResourceTable' }).exists()).toBe(true);
    expect(store.dispatch).not.toHaveBeenCalledWith('loadingError', expect.anything());
  });
});

describe('component: ResourceList, opened from a link to some of its states', () => {
  const completed = {
    id: 'b', stateDisplay: 'Completed', stateBackground: 'bg-info', metadata: { state: { name: 'completed' } }
  };
  // A state the model works out, which the backend doesn't store
  const expiring = {
    id: 'c', state: 'expiring', stateDisplay: 'Expiring', stateBackground: 'bg-warning', metadata: { state: { name: 'active' } }
  };

  const mountList = (tableViews: boolean) => {
    const store = createStore({ schema: { id: 'pod' } });
    const push = jest.fn();

    Object.assign(store.getters, {
      'features/get':        () => tableViews,
      // The bar is in the masthead
      'type-map/optionsFor': () => ({ showListMasthead: true }),
    });

    const wrapper = shallowMount(ResourceList as any, {
      data:   () => ({ rows: [completed, expiring], perfConfig: { incrementalLoading: { enabled: false } } }),
      global: {
        mocks: {
          $store: store, $route: { params: { resource: 'pod' }, query: { stateFilter: 'completed,expiring,error', q: 'kept' } }, $router: { push }, t: (key: string) => key
        },
        stubs: {
          FailWhale:      true,
          ResourceTable:  true,
          ExtensionPanel: true,
          IconMessage:    true,
          Loading:        true,
          BadgeState:     { props: ['label', 'color'], template: '<span class="badge">{{ label }}/{{ color }}</span>' },
          // Renders the slot the bar goes in
          Masthead:       { template: '<div><slot name="subHeader" /></div>' },
        },
      },
    });

    return { wrapper, push };
  };

  it('should say which states the list is filtered to without table views', () => {
    const { wrapper } = mountList(false);
    const bar = wrapper.find('.state-filter-bar');

    expect(bar.text()).toContain('resourceList.stateFilterApplied');
    expect(bar.findAll('.badge').map((b) => b.text())).toStrictEqual(['Completed/bg-info', 'Expiring/bg-warning', 'Error/bg-error-color']);
  });

  it('should clear the filter, keeping the rest of the query', async() => {
    const { wrapper, push } = mountList(false);

    await wrapper.find('.state-filter-bar a').trigger('click');

    expect(push).toHaveBeenCalledWith(expect.objectContaining({ query: { q: 'kept' } }));
  });

  it('should say nothing when the table views have the states', () => {
    const { wrapper } = mountList(true);

    expect(wrapper.find('.state-filter-bar').exists()).toBe(false);
  });
});
