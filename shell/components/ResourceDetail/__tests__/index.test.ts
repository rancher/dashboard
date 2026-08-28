import { shallowMount } from '@vue/test-utils';
import ResourceDetail from '@shell/components/ResourceDetail/index.vue';
import {
  _VIEW, _EDIT, _DETAIL, _CONFIG, _YAML
} from '@shell/config/query-params';

jest.mock('@shell/mixins/create-edit-view/impl', () => ({
  __esModule: true,
  default:    {
    computed: {
      doneRoute() {
        return null;
      },
      doneParams() {
        return {};
      },
    },
  },
}));

jest.mock('@shell/composables/resourceDetail', () => ({ useResourceDetailPageProvider: jest.fn() }));

type StoreOpts = {
  schema?: any;
  findError?: any;
};

const createStore = ({ schema, findError }: StoreOpts) => {
  const dispatch = jest.fn((action: string) => {
    if (action.endsWith('/find')) {
      if (findError) {
        return Promise.reject(findError);
      }

      return Promise.resolve({});
    }
    if (action.endsWith('/clone') || action.endsWith('/cleanForDetail')) {
      return Promise.resolve({});
    }

    return Promise.resolve();
  });

  return {
    getters: {
      'i18n/t':                   (key: string, args: any) => `${ key }-${ JSON.stringify(args ?? {}) }`,
      currentStore:               () => 'cluster',
      'cluster/schemaFor':        () => schema,
      'cluster/all':              () => [],
      'type-map/hasCustomDetail': () => false,
      'type-map/hasCustomEdit':   () => false,
      'type-map/importDetail':    () => null,
      'type-map/importEdit':      () => null,
      'type-map/optionsFor':      () => ({}),
    },
    dispatch,
  };
};

const createWrapper = (store: any) => {
  // Start with pending: true so the initial render is the Loading stub (the
  // real component doesn't guard `value.name` because the Nuxt `fetch()`
  // hook is what populates `value` — under the test harness we drive that
  // by hand).
  const fetchState = { pending: true };

  const wrapper = shallowMount(ResourceDetail as any, {
    global: {
      mocks: {
        $store:      store,
        $route:      { params: { resource: 'bogus-resource-type', id: 'bogus-id' }, query: {} },
        $fetchState: fetchState,
        t:           (key: string, args: any) => `${ key }-${ JSON.stringify(args ?? {}) }`,
      },
      stubs: {
        FailWhale:    true,
        Masthead:     true,
        Loading:      true,
        ResourceYaml: true,
        Banner:       true,
        IconMessage:  true,
        DetailTop:    true,
      },
      directives: {
        'ui-context': () => {},
        shortkey:     () => {},
        'clean-html': () => {},
      },
    },
  });

  return { wrapper, fetchState };
};

const runFetch = async(wrapper: any, fetchState: any) => {
  await (wrapper.vm.$options as any).fetch.call(wrapper.vm);
  fetchState.pending = false;
  wrapper.vm.$forceUpdate();
  await wrapper.vm.$nextTick();
};

describe('component: ResourceDetail', () => {
  it('renders the in-context FailWhale (not the details) when the resource type has no schema', async() => {
    const store = createStore({ schema: undefined });
    const { wrapper, fetchState } = createWrapper(store);

    await runFetch(wrapper, fetchState);

    expect((wrapper.vm as any).resourceNotFoundError).toBeInstanceOf(Error);
    expect(wrapper.findComponent({ name: 'FailWhale' }).exists()).toBe(true);
    expect(wrapper.findComponent({ name: 'Masthead' }).exists()).toBe(false);
    // Must NOT redirect to the global fail-whale page
    expect(store.dispatch).not.toHaveBeenCalledWith('loadingError', expect.anything());
  });

  it('renders the in-context FailWhale when the resource is not found (404)', async() => {
    const store = createStore({ schema: { id: 'bogus-resource-type' }, findError: { status: 404 } });
    const { wrapper, fetchState } = createWrapper(store);

    await runFetch(wrapper, fetchState);

    expect((wrapper.vm as any).resourceNotFoundError).toBeInstanceOf(Error);
    expect(wrapper.findComponent({ name: 'FailWhale' }).exists()).toBe(true);
    expect(wrapper.findComponent({ name: 'Masthead' }).exists()).toBe(false);
    expect(store.dispatch).not.toHaveBeenCalledWith('loadingError', expect.anything());
  });

  it('renders the in-context FailWhale when the resource is forbidden (403)', async() => {
    const store = createStore({ schema: { id: 'bogus-resource-type' }, findError: { status: 403 } });
    const { wrapper, fetchState } = createWrapper(store);

    await runFetch(wrapper, fetchState);

    expect((wrapper.vm as any).resourceNotFoundError).toBeInstanceOf(Error);
    expect(wrapper.findComponent({ name: 'FailWhale' }).exists()).toBe(true);
    expect(store.dispatch).not.toHaveBeenCalledWith('loadingError', expect.anything());
  });

  it('does not set resourceNotFoundError when the resource is found', async() => {
    const store = createStore({ schema: { id: 'bogus-resource-type' } });
    const { wrapper, fetchState } = createWrapper(store);

    await runFetch(wrapper, fetchState);

    expect((wrapper.vm as any).resourceNotFoundError).toBeNull();
    expect(store.dispatch).not.toHaveBeenCalledWith('loadingError', expect.anything());
  });

  // fullDetailPageOverride should only apply to the detail view, so the config/YAML
  // views keep the padded ".outlet" wrapper.
  describe.each([
    {
      desc: 'detail view of a full-page override resource', mode: _VIEW, as: _DETAIL, fullDetailPageOverride: true, expected: true
    },
    {
      desc: 'config view of a full-page override resource', mode: _VIEW, as: _CONFIG, fullDetailPageOverride: true, expected: false
    },
    {
      desc: 'yaml view of a full-page override resource', mode: _VIEW, as: _YAML, fullDetailPageOverride: true, expected: false
    },
    {
      desc: 'detail view of a non-override resource', mode: _VIEW, as: _DETAIL, fullDetailPageOverride: false, expected: false
    },
    {
      desc: 'edit mode of a full-page override resource', mode: _EDIT, as: _CONFIG, fullDetailPageOverride: true, expected: false
    },
  ])('isFullPageOverride: $desc', ({
    mode, as, fullDetailPageOverride, expected
  }) => {
    it(`is ${ expected }`, async() => {
      const store = createStore({ schema: { id: 'bogus-resource-type' } });
      const { wrapper } = createWrapper(store);

      await wrapper.setData({
        mode, as, value: { fullDetailPageOverride }
      });

      expect((wrapper.vm as any).isFullPageOverride).toBe(expected);
    });
  });
});
