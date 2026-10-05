import { shallowMount } from '@vue/test-utils';
import ResourceList from '@shell/components/ResourceList/index.vue';

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
        perfConfig:                 { incrementalLoading: { enabled: false } },
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
  showListMasthead?: boolean;
};

const createStore = ({ schema, canList = true, showListMasthead = false }: StoreOpts) => ({
  getters: {
    'i18n/t':                 (key: string, args: any) => `${ key }-${ JSON.stringify(args ?? {}) }`,
    currentStore:             () => 'cluster',
    'cluster/schemaFor':      () => schema,
    'cluster/all':            () => [],
    'cluster/canList':        () => canList,
    'type-map/hasCustomList': () => false,
    'type-map/optionsFor':    () => ({ showListMasthead }),
    'type-map/headersFor':    () => [],
    'type-map/groupByFor':    () => null,
    'type-map/importList':    () => ({}),
  },
  dispatch: jest.fn(),
});

// Renders the subHeader slot so the filter banners can be asserted on
const MastheadStub = {
  name:     'Masthead',
  template: '<div><slot name="subHeader" /></div>',
};

const createWrapper = (store: any, { query = {}, router = { push: jest.fn() } }: { query?: Record<string, string>, router?: any } = {}) => {
  return shallowMount(ResourceList as any, {
    global: {
      mocks: {
        $store:  store,
        $route:  { params: { resource: 'bogus-resource-type' }, query },
        $router: router,
        t:       (key: string, args: any) => `${ key }-${ JSON.stringify(args ?? {}) }`,
      },
      stubs: {
        FailWhale:      true,
        ResourceTable:  true,
        Masthead:       MastheadStub,
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

  describe('name filter', () => {
    const listableStore = () => createStore({
      schema: { id: 'bogus-resource-type' }, canList: true, showListMasthead: true
    });

    it('should use the nameFilter query as the active name filter', () => {
      const wrapper = createWrapper(listableStore(), { query: { nameFilter: 'nginx' } });

      expect((wrapper.vm as any).activeNameFilter).toStrictEqual('nginx');
    });

    it('should have an empty active name filter when there is no nameFilter query', () => {
      const wrapper = createWrapper(listableStore());

      expect((wrapper.vm as any).activeNameFilter).toStrictEqual('');
    });

    it('should not show a filter banner when there is no nameFilter or stateFilter query', () => {
      const wrapper = createWrapper(listableStore());

      expect(wrapper.find('.state-filter-bar').exists()).toBe(false);
    });

    it('should show a banner with the name filter when there is a nameFilter query', () => {
      const wrapper = createWrapper(listableStore(), { query: { nameFilter: 'nginx' } });

      const banners = wrapper.findAll('.state-filter-bar');

      expect(banners).toHaveLength(1);
      expect(banners[0].text()).toContain('resourceList.nameFilterApplied');
      expect(banners[0].text()).toContain('nginx');
    });

    it('should show both the state and name filter banners when both queries are set', () => {
      const wrapper = createWrapper(listableStore(), { query: { nameFilter: 'nginx', stateFilter: 'running' } });

      const banners = wrapper.findAll('.state-filter-bar');

      expect(banners).toHaveLength(2);
      expect(banners[0].text()).toContain('resourceList.stateFilterApplied');
      expect(banners[1].text()).toContain('resourceList.nameFilterApplied');
    });

    it('should remove only the nameFilter query when the name filter is cleared', async() => {
      const router = { push: jest.fn() };
      const wrapper = createWrapper(listableStore(), { query: { nameFilter: 'nginx', stateFilter: 'running' }, router });

      await wrapper.findAll('.state-filter-bar')[1].find('a').trigger('click');

      expect(router.push).toHaveBeenCalledWith({
        params: { resource: 'bogus-resource-type' },
        query:  { stateFilter: 'running' },
      });
    });
  });
});
