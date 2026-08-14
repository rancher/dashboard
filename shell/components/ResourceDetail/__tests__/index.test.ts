import { shallowMount, VueWrapper } from '@vue/test-utils';
import ResourceDetail from '@shell/components/ResourceDetail/index.vue';
import ResourceTemplateUtils from '@shell/utils/resource-template';
import { AS, _YAML } from '@shell/config/query-params';

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

jest.mock('@shell/utils/resource-template', () => ({
  __esModule: true,
  default:    {
    applyTemplate:          jest.fn(),
    stageFormApply:         jest.fn(),
    consumeStagedFormApply: jest.fn().mockReturnValue(null),
    mergeTemplateOntoYaml:  jest.fn(),
  },
}));

jest.mock('@shell/utils/create-yaml', () => ({
  ...jest.requireActual('@shell/utils/create-yaml'),
  createYaml:            jest.fn(),
  createYamlWithOptions: jest.fn().mockReturnValue('mocked-current-yaml'),
}));

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
});

const t = (key: string): string => key;

describe('component: ResourceDetail/index', () => {
  let wrapper: VueWrapper<any>;

  const mockConfigMap = { metadata: { namespace: 'default', name: 'my-template' } };

  const mountComponent = (dataOverrides: Record<string, any> = {}) => {
    const dispatch = jest.fn();
    const applyQuery = jest.fn().mockResolvedValue(undefined);
    const fetch = jest.fn().mockResolvedValue(undefined);
    const store = {
      getters: {
        currentStore:               () => 'current_store',
        'current_store/schemaFor':  jest.fn(),
        'current_store/all':        jest.fn(),
        'type-map/hasCustomDetail': jest.fn(),
        'type-map/hasCustomEdit':   jest.fn(),
        'type-map/optionsFor':      jest.fn().mockReturnValue({}),
        'type-map/importDetail':    jest.fn(),
        'type-map/importEdit':      jest.fn(),
        'i18n/t':                   t,
        'i18n/exists':              jest.fn(),
      },
      dispatch,
    };

    const w = shallowMount(ResourceDetail, {
      // fetch() doesn't run in tests (the global fetch mixin isn't installed here), so seed the
      // data it would normally have populated by now - needed at mount time (not after) since
      // the template dereferences value.name/liveModel.name on the very first render.
      data() {
        return {
          liveModel: {}, showMasthead: false, value: {}, ...dataOverrides
        };
      },
      global: {
        mocks: {
          $store:      store,
          $route:      { params: {}, query: {} },
          $router:     { applyQuery },
          $fetchState: { pending: false },
          // this.$fetch() (see onTemplateSelected's "apply to form" path) is normally supplied by
          // the global fetch mixin, which - like $fetchState above - isn't installed here.
          $fetch:      fetch,
          t,
        },
        stubs: {
          Loading: true, Masthead: true, ResourceYaml: true, IconMessage: true, Banner: true, DetailTop: true
        },
      },
    });

    return {
      wrapper: w, dispatch, applyQuery, fetch
    };
  };

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }

    jest.clearAllMocks();
  });

  describe('method: onTemplateSelected', () => {
    describe('while viewing yaml directly (this.isYaml true)', () => {
      it('should prompt a single-choice confirmation and apply immediately, no reload', async() => {
        const mounted = mountComponent({
          resourceType: 'apps.deployment', value: { type: 'apps.deployment' }, as: _YAML
        });

        wrapper = mounted.wrapper;
        (ResourceTemplateUtils.applyTemplate as jest.Mock).mockReturnValue('kind: Deployment');

        const applyTemplateYaml = jest.fn();

        // $refs is proxied from the internal component instance in Vue 3 - mutate that directly
        (wrapper.vm.$ as any).refs = { resourceyaml: { applyTemplateYaml } };

        wrapper.vm.onTemplateSelected(mockConfigMap);

        expect(mounted.dispatch).toHaveBeenCalledWith('current_store/promptModal', {
          component:      'GenericPrompt',
          componentProps: expect.objectContaining({
            title:       'resourceTemplateSelector.confirmTitle',
            body:        'resourceTemplateSelector.confirmBodyYaml',
            applyMode:   'apply',
            applyAction: expect.any(Function),
          }),
        });

        const { applyAction } = mounted.dispatch.mock.calls[0][1].componentProps;

        await applyAction();

        expect(ResourceTemplateUtils.applyTemplate).toHaveBeenCalledWith(wrapper.vm.value, mockConfigMap);
        expect(wrapper.vm.yaml).toBe('kind: Deployment');
        expect(applyTemplateYaml).toHaveBeenCalledWith('kind: Deployment');
      });

      it.each([
        ['a successful apply', true],
        ['Cancel', false],
      ])('should reset the registered ResourceTemplateSelector after %s', (_, confirmedValue) => {
        const mounted = mountComponent({
          resourceType: 'apps.deployment', value: { type: 'apps.deployment' }, as: _YAML
        });

        wrapper = mounted.wrapper;
        const reset = jest.fn();

        wrapper.vm.registerTemplateSelector(reset);
        wrapper.vm.onTemplateSelected(mockConfigMap);

        const { confirm } = mounted.dispatch.mock.calls[0][1].componentProps;

        confirm(confirmedValue);

        expect(reset).toHaveBeenCalledWith();
      });
    });

    describe('while viewing the custom form (this.isYaml false)', () => {
      const mountFormView = () => mountComponent({
        resourceType: 'apps.deployment', value: { type: 'apps.deployment' }, as: 'config'
      });

      it('should prompt a confirmation modal offering both apply-to-form and apply-to-yaml', () => {
        const mounted = mountFormView();

        wrapper = mounted.wrapper;
        wrapper.vm.onTemplateSelected(mockConfigMap);

        expect(mounted.dispatch).toHaveBeenCalledWith('current_store/promptModal', {
          component:      'GenericPrompt',
          componentProps: expect.objectContaining({
            title:                'resourceTemplateSelector.confirmTitle',
            body:                 'resourceTemplateSelector.confirmBodyForm',
            applyMode:            'applyToForm',
            applyAction:          expect.any(Function),
            secondaryApplyMode:   'applyToYaml',
            secondaryApplyAction: expect.any(Function),
          }),
        });
      });

      describe('apply to form', () => {
        // Regression guard: this path used to window.location.reload() (see git history) -
        // replaced by $fetch() + a forced remount, since a plain page reload was visually
        // jarring. Confirm the old mechanism is gone, not just that the new one is present.
        let originalLocation: PropertyDescriptor | undefined;
        let reload: jest.Mock;

        beforeEach(() => {
          originalLocation = Object.getOwnPropertyDescriptor(window, 'location');
          reload = jest.fn();
          Object.defineProperty(window, 'location', {
            value: { reload }, writable: true, configurable: true
          });
        });

        afterEach(() => {
          if (originalLocation) {
            Object.defineProperty(window, 'location', originalLocation);
          }
        });

        it('should stage the current value yaml + template, clear stale errors, $fetch(), then bump formRemountKey', async() => {
          const mounted = mountFormView();

          wrapper = mounted.wrapper;
          wrapper.vm.errors = ['some stale error'];
          const initialRemountKey = wrapper.vm.formRemountKey;

          wrapper.vm.onTemplateSelected(mockConfigMap);

          const { applyAction } = mounted.dispatch.mock.calls[0][1].componentProps;

          await applyAction();

          expect(ResourceTemplateUtils.stageFormApply).toHaveBeenCalledWith('mocked-current-yaml', mockConfigMap);
          expect(wrapper.vm.errors).toStrictEqual([]);
          expect(mounted.fetch).toHaveBeenCalledWith();
          expect(wrapper.vm.formRemountKey).toBe(initialRemountKey + 1);
          expect(reload).not.toHaveBeenCalled();
        });
      });

      describe('apply to yaml', () => {
        it('should delegate to the registered CruResource when one is present', async() => {
          const mounted = mountFormView();

          wrapper = mounted.wrapper;
          const applyTemplate = jest.fn().mockResolvedValue(undefined);

          wrapper.vm.cruResource = { applyTemplate };
          wrapper.vm.onTemplateSelected(mockConfigMap);

          const { secondaryApplyAction } = mounted.dispatch.mock.calls[0][1].componentProps;

          await secondaryApplyAction();

          expect(applyTemplate).toHaveBeenCalledWith(mockConfigMap);
          expect(ResourceTemplateUtils.mergeTemplateOntoYaml).not.toHaveBeenCalled();
          expect(mounted.applyQuery).not.toHaveBeenCalled();
        });

        it('should merge the template onto the current value yaml and switch to yaml view when no CruResource is registered', async() => {
          const mounted = mountFormView();

          wrapper = mounted.wrapper;
          (ResourceTemplateUtils.mergeTemplateOntoYaml as jest.Mock).mockReturnValue('merged-yaml');

          wrapper.vm.onTemplateSelected(mockConfigMap);

          const { secondaryApplyAction } = mounted.dispatch.mock.calls[0][1].componentProps;

          await secondaryApplyAction();

          expect(ResourceTemplateUtils.mergeTemplateOntoYaml).toHaveBeenCalledWith('mocked-current-yaml', mockConfigMap);
          expect(wrapper.vm.yaml).toBe('merged-yaml');
          expect(wrapper.vm.as).toBe(_YAML);
          expect(mounted.applyQuery).toHaveBeenCalledWith({ [AS]: _YAML });
        });
      });

      describe('template selector reset (confirm callback)', () => {
        it.each([
          ['a successful apply', true],
          ['Cancel', false],
        ])('should reset the registered ResourceTemplateSelector after %s', (_, confirmedValue) => {
          const mounted = mountFormView();

          wrapper = mounted.wrapper;
          const reset = jest.fn();

          wrapper.vm.registerTemplateSelector(reset);
          wrapper.vm.onTemplateSelected(mockConfigMap);

          const { confirm } = mounted.dispatch.mock.calls[0][1].componentProps;

          confirm(confirmedValue);

          expect(reset).toHaveBeenCalledWith();
        });
      });
    });
  });

  describe('method: registerCruResource', () => {
    it('should store the registered CruResource instance', () => {
      const mounted = mountComponent();

      wrapper = mounted.wrapper;
      const instance = { applyTemplate: jest.fn(), currentEditYaml: jest.fn() };

      wrapper.vm.registerCruResource(instance);

      // Vue wraps the assigned object in a reactive Proxy, so it's no longer reference-equal
      // (toBe) to the original - compare structurally instead.
      expect(wrapper.vm.cruResource).toStrictEqual(instance);
    });

    it('should clear the registered instance when unregistered', () => {
      const mounted = mountComponent();

      wrapper = mounted.wrapper;
      wrapper.vm.registerCruResource({ applyTemplate: jest.fn() });

      wrapper.vm.registerCruResource(null);

      expect(wrapper.vm.cruResource).toBeNull();
    });
  });

  describe('method: registerTemplateSelector', () => {
    it('should store the registered reset function', () => {
      const mounted = mountComponent();

      wrapper = mounted.wrapper;
      const reset = jest.fn();

      wrapper.vm.registerTemplateSelector(reset);

      expect(wrapper.vm.templateSelectorReset).toBe(reset);
    });
  });

  describe('method: currentEditYaml', () => {
    it('should read the live yaml off the top-level ResourceYaml ref when isYaml', async() => {
      const mounted = mountComponent({
        resourceType: 'apps.deployment', value: { type: 'apps.deployment' }, as: _YAML, yaml: 'stale-yaml'
      });

      wrapper = mounted.wrapper;
      (wrapper.vm.$ as any).refs = { resourceyaml: { currentYaml: 'live-yaml' } };

      await expect(wrapper.vm.currentEditYaml()).resolves.toBe('live-yaml');
    });

    it('should fall back to this.yaml when isYaml but the ResourceYaml ref is not available yet', async() => {
      const mounted = mountComponent({
        resourceType: 'apps.deployment', value: { type: 'apps.deployment' }, as: _YAML, yaml: 'stale-yaml'
      });

      wrapper = mounted.wrapper;

      await expect(wrapper.vm.currentEditYaml()).resolves.toBe('stale-yaml');
    });

    it('should delegate to the registered CruResource when not showing yaml', async() => {
      const mounted = mountComponent({
        resourceType: 'apps.deployment', value: { type: 'apps.deployment' }, as: 'config'
      });

      wrapper = mounted.wrapper;
      const currentEditYaml = jest.fn().mockResolvedValue('cru-yaml');

      wrapper.vm.cruResource = { currentEditYaml };

      await expect(wrapper.vm.currentEditYaml()).resolves.toBe('cru-yaml');
      expect(currentEditYaml).toHaveBeenCalledWith();
    });

    it('should fall back to regenerating the yaml when not showing yaml and no CruResource is registered', async() => {
      const mounted = mountComponent({
        resourceType: 'apps.deployment', value: { type: 'apps.deployment' }, as: 'config'
      });

      wrapper = mounted.wrapper;

      await expect(wrapper.vm.currentEditYaml()).resolves.toBe('mocked-current-yaml');
    });
  });

  describe('method: onSaveTemplate', () => {
    it('should dispatch promptModal with SaveAsTemplateDialog, the current resource, and the current edit yaml', async() => {
      const mounted = mountComponent({
        resourceType: 'apps.deployment', value: { type: 'apps.deployment' }, as: 'config'
      });

      wrapper = mounted.wrapper;

      await wrapper.vm.onSaveTemplate();

      expect(mounted.dispatch).toHaveBeenCalledWith('current_store/promptModal', {
        component:      'SaveAsTemplateDialog',
        resources:      [wrapper.vm.value],
        modalWidth:     '750px',
        componentProps: { initialYaml: 'mocked-current-yaml' },
      });
    });
  });
});
