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
