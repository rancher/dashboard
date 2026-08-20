import { mount } from '@vue/test-utils';
import CruResource from '@shell/components/CruResource.vue';
import {
  AS, _CREATE, _EDIT, _VIEW, _YAML
} from '@shell/config/query-params';
import TextAreaAutoGrow from '@components/Form/TextArea/TextAreaAutoGrow.vue';
import ResourceTemplateUtils from '@shell/utils/resource-template';

jest.mock('@shell/utils/resource-template', () => ({
  __esModule: true,
  default:    { mergeTemplateOntoYaml: jest.fn() },
}));

jest.mock('@shell/utils/create-yaml', () => ({
  ...jest.requireActual('@shell/utils/create-yaml'),
  createYamlWithOptions: jest.fn().mockReturnValue('generated-resource-yaml'),
}));

describe('component: CruResource', () => {
  it('should hide Cancel button', () => {
    const wrapper = mount(CruResource, {
      props: {
        canYaml:  false,
        mode:     _EDIT,
        resource: {}
      },
      global: {
        mocks: {
          $store: {
            getters: {
              currentStore:              () => 'current_store',
              'current_store/schemaFor': jest.fn(),
              'current_store/all':       jest.fn(),
              'i18n/t':                  jest.fn(),
              'i18n/exists':             jest.fn(),
            },
            dispatch: jest.fn(),
          },
          $route:  { query: { AS: _YAML } },
          $router: { applyQuery: jest.fn() },
        },
      }
    });

    const element = wrapper.find('#cru-cancel').element;

    expect(element).toBeDefined();
  });

  it('should display multiple errors', () => {
    const errors = ['mistake!', 'BiG MiStAke11'];
    const wrapper = mount(CruResource, {
      props: {
        canYaml:  false,
        mode:     _EDIT,
        resource: {},
        errors
      },
      global: {
        mocks: {
          $store: {
            getters: {
              currentStore:              () => 'current_store',
              'current_store/schemaFor': jest.fn(),
              'current_store/all':       jest.fn(),
              'i18n/t':                  jest.fn(),
              'i18n/exists':             jest.fn(),
            },
            dispatch: jest.fn(),
          },
          $route:  { query: { AS: _YAML } },
          $router: { applyQuery: jest.fn() },
        },
      }
    });

    const node = wrapper.find('#cru-errors');

    expect(node.element.childElementCount).toBe(errors.length);
    expect(node.text()).toContain(errors[0]);
    expect(node.text()).toContain(errors[1]);
  });

  it('should announce the errors container as an assertive live region', () => {
    const wrapper = mount(CruResource, {
      props: {
        canYaml:  false,
        mode:     _EDIT,
        resource: {},
        errors:   ['mistake!']
      },
      global: {
        mocks: {
          $store: {
            getters: {
              currentStore:              () => 'current_store',
              'current_store/schemaFor': jest.fn(),
              'current_store/all':       jest.fn(),
              'i18n/t':                  jest.fn(),
              'i18n/exists':             jest.fn(),
            },
            dispatch: jest.fn(),
          },
          $route:  { query: { AS: _YAML } },
          $router: { applyQuery: jest.fn() },
        },
      }
    });

    const node = wrapper.find('#cru-errors');

    expect(node.attributes('role')).toStrictEqual('alert');
    expect(node.attributes('aria-live')).toStrictEqual('assertive');
  });

  it.each([
    ['no errors prop', undefined],
    ['an empty errors array', []],
  ])('should not render the errors container given %s', (_label, errors) => {
    const wrapper = mount(CruResource, {
      props: {
        canYaml:  false,
        mode:     _EDIT,
        resource: {},
        errors
      },
      global: {
        mocks: {
          $store: {
            getters: {
              currentStore:              () => 'current_store',
              'current_store/schemaFor': jest.fn(),
              'current_store/all':       jest.fn(),
              'i18n/t':                  jest.fn(),
              'i18n/exists':             jest.fn(),
            },
            dispatch: jest.fn(),
          },
          $route:  { query: { AS: _YAML } },
          $router: { applyQuery: jest.fn() },
        },
      }
    });

    expect(wrapper.find('#cru-errors').exists()).toStrictEqual(false);
  });

  it.each([
    ['error', 'error'],
    [{
      code: 'ActionNotAvailable', status: 500, message: 'error'
    }, 'errors.actionNotAvailable'],
    [{
      status: 422, fieldName: 'Name', code: 'NotUnique', message: 'error'
    }, 'errors.failedInApi.withName.withCodeExplanation.withMessageDetail'],
    [{
      status: 422, fieldName: 'Name', code: 'NotUnique'
    }, 'errors.failedInApi.withName.withCodeExplanation.withoutMessageDetail'],
    [{
      status: 422, fieldName: 'Name', code: 'Brr', message: 'error'
    }, 'errors.failedInApi.withName.withMessageDetail'],
    [{
      status: 422, fieldName: 'Name', code: 'Brr'
    }, 'errors.failedInApi.withName.withoutAnythingElse'],
    [{
      status: 422, code: 'NotUnique', message: 'error'
    }, 'errors.failedInApi.withoutName.withMessageDetail.withCodeExplanation'],
    [{ status: 422, message: 'error' }, 'errors.failedInApi.withoutName.withMessageDetail.withoutCodeExplanation'],
    [{ status: 422, code: 'NotUnique' }, 'errors.failedInApi.withoutName.withCode.withCodeExplanation'],
    [{ status: 422, code: 'Brr' }, 'errors.failedInApi.withoutName.withCode.withoutCodeExplanation'],
    [{ status: 422 }, 'errors.failedInApi.withoutAnything'],
    [{ status: 404, message: 'message' }, 'errors.notFound.withoutUrl'],
    [{
      status: 404, message: 'message', opt: { url: 'test' }
    }, 'errors.notFound.withUrl'],
    [{ status: 500, message: 'message' }, 'errors.messageOrDetail'],
    [{
      status: 500, message: 'message', detail: 'detail'
    }, 'errors.messageAndDetail'],
    [{ status: 500, detail: 'detail' }, 'errors.messageOrDetail'],
  ])('should display correct error', (err, res) => {
    const wrapper = mount(CruResource, {
      props: {
        canYaml:  false,
        mode:     _EDIT,
        resource: {},
        errors:   [err]
      },
      global: {
        mocks: {
          $store: {
            getters: {
              currentStore:              () => 'current_store',
              'current_store/schemaFor': jest.fn(),
              'current_store/all':       jest.fn(),
              'i18n/t':                  (text: string) => text,
              'i18n/exists':             jest.fn(),
            },
            dispatch: jest.fn(),
          },
          $route:  { query: { AS: _YAML } },
          $router: { applyQuery: jest.fn() },
        },
      }
    });
    const node = wrapper.find('#cru-errors');

    expect(node.text()).toContain(res);
  });

  it('should prevent default events on keypress Enter', async() => {
    const event = { preventDefault: jest.fn() };
    const wrapper = mount(CruResource, {
      props: {
        canYaml:            true,
        mode:               _EDIT,
        resource:           {},
        preventEnterSubmit: true
      },

      slots: { default: TextAreaAutoGrow },

      global: {
        mocks: {
          $store: {
            getters: {
              currentStore:              () => 'current_store',
              'current_store/schemaFor': jest.fn(),
              'current_store/all':       jest.fn(),
              'i18n/t':                  jest.fn(),
              'i18n/exists':             jest.fn(),
            },
            dispatch: jest.fn(),
          },
          $route:  { query: { AS: _YAML } },
          $router: { applyQuery: jest.fn() },
        },

        stubs: { TextAreaAutoGrow },
      },
    });

    const textAreaField = wrapper.find('[data-testid="text-area-auto-grow"]');

    await textAreaField.trigger('focus');
    await textAreaField.trigger('keydown.enter', event);

    expect(event.preventDefault).toHaveBeenCalledWith();
  });

  it.each([
    [_EDIT, true],
    [_CREATE, true],
    [_VIEW, false],
  ])('should render CruResourceFooter when mode is %s: %s', (mode: string, shouldRender: boolean) => {
    const wrapper = mount(CruResource, {
      props: {
        canYaml:  false,
        mode,
        resource: {}
      },
      global: {
        mocks: {
          $store: {
            getters: {
              currentStore:              () => 'current_store',
              'current_store/schemaFor': jest.fn(),
              'current_store/all':       jest.fn(),
              'i18n/t':                  jest.fn(),
              'i18n/exists':             jest.fn(),
            },
            dispatch: jest.fn(),
          },
          $route:  { query: { AS: _YAML } },
          $router: { applyQuery: jest.fn() },
        },
      }
    });

    const footer = wrapper.find('.cru-resource-footer');

    expect(footer.exists()).toBe(shouldRender);
  });

  it('should not prevent default events on keypress Enter', async() => {
    const event = { preventDefault: jest.fn() };
    const wrapper = mount(CruResource, {
      props: {
        canYaml:            false,
        mode:               _EDIT,
        resource:           {},
        preventEnterSubmit: false
      },

      components: {
        ResourceYaml:        { template: '<div></div> ' },
        ResourceCancelModal: { template: '<div></div> ' },
      },

      slots: { default: TextAreaAutoGrow },

      global: {
        mocks: {
          $store: {
            getters: {
              currentStore:              () => 'current_store',
              'current_store/schemaFor': jest.fn(),
              'current_store/all':       jest.fn(),
              'i18n/t':                  jest.fn(),
              'i18n/exists':             jest.fn(),
            },
            dispatch: jest.fn(),
          },
          $route:  { query: { AS: _YAML } },
          $router: { applyQuery: jest.fn() },
        },

        stubs: { TextAreaAutoGrow },
      },
    });

    const textAreaField = wrapper.find('[data-testid="text-area-auto-grow"]');

    await textAreaField.trigger('focus');
    await textAreaField.trigger('keydown.enter', event);

    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  // resource-template.ts's mergeTemplateOntoYaml is mocked above, and createYamlWithOptions is
  // mocked to always return 'generated-resource-yaml' - so createResourceYaml() (used by both
  // methods under test below) is deterministic without needing to stub the whole yaml-generation
  // pipeline.
  describe('resource template support (registerCruResource / applyTemplate / currentEditYaml)', () => {
    const mockConfigMap = { metadata: { namespace: 'default', name: 'my-template' } };

    // $route.query.AS drives the initial showAsForm value (see CruResource.vue's data()) -
    // { AS: _YAML } starts already showing this component's own nested yaml view (showAsForm
    // false), an empty query starts in plain form view (showAsForm true).
    const mountForTemplateSupport = (routeQuery: Record<string, any> = {}) => {
      const applyQuery = jest.fn();
      const registerCruResource = jest.fn();

      const wrapper = mount(CruResource, {
        props: {
          canYaml: true, mode: _EDIT, resource: { type: 'apps.deployment' }
        },
        global: {
          provide: { registerCruResource },
          mocks:   {
            $store: {
              getters: {
                currentStore:              () => 'current_store',
                'current_store/schemaFor': jest.fn(),
                'current_store/all':       jest.fn(),
                'i18n/t':                  jest.fn(),
                'i18n/exists':             jest.fn(),
              },
              dispatch: jest.fn(),
            },
            $route:  { query: routeQuery },
            $router: { applyQuery },
          },
        }
      });

      return {
        wrapper, applyQuery, registerCruResource
      };
    };

    afterEach(() => {
      jest.clearAllMocks();
    });

    describe('registerCruResource injection', () => {
      it('should register itself on mount and unregister on unmount', () => {
        const { wrapper, registerCruResource } = mountForTemplateSupport();

        expect(registerCruResource).toHaveBeenCalledTimes(1);

        // Asserting reference equality against wrapper.vm (a Vue proxy) directly is avoided here -
        // a failed toBe comparison would try to enumerate the proxy's keys to build a diff, which
        // errors given this test's intentionally-minimal $store mock. A structural check on the
        // registered instance's own template-support methods is enough to confirm it registered
        // itself (this), not something else.
        const registered = registerCruResource.mock.calls[0][0];

        expect(typeof registered.applyTemplate).toBe('function');
        expect(typeof registered.currentEditYaml).toBe('function');

        wrapper.unmount();

        expect(registerCruResource).toHaveBeenLastCalledWith(null);
      });
    });

    describe('method: applyTemplate', () => {
      it('should generate the current yaml, merge the template on top, and switch into yaml view when currently showing the form', async() => {
        (ResourceTemplateUtils.mergeTemplateOntoYaml as jest.Mock).mockReturnValue('merged-yaml');

        const { wrapper, applyQuery } = mountForTemplateSupport(); // no AS query -> showAsForm true

        await wrapper.vm.applyTemplate(mockConfigMap);

        expect(ResourceTemplateUtils.mergeTemplateOntoYaml).toHaveBeenCalledWith('generated-resource-yaml', mockConfigMap);
        expect(wrapper.vm.resourceYaml).toBe('merged-yaml');
        expect(wrapper.vm.showAsForm).toBe(false);
        expect(applyQuery).toHaveBeenCalledWith({ [AS]: _YAML });
      });

      it('should push the merged yaml into the already-showing nested ResourceYaml instead, when already in yaml view', async() => {
        (ResourceTemplateUtils.mergeTemplateOntoYaml as jest.Mock).mockReturnValue('merged-yaml');

        const { wrapper, applyQuery } = mountForTemplateSupport({ [AS]: _YAML }); // showAsForm false
        const applyTemplateYaml = jest.fn();

        // $refs is proxied from the internal component instance in Vue 3 - mutate that directly
        (wrapper.vm.$ as any).refs = { resourceyaml: { applyTemplateYaml } };

        await wrapper.vm.applyTemplate(mockConfigMap);

        expect(wrapper.vm.resourceYaml).toBe('merged-yaml');
        expect(applyTemplateYaml).toHaveBeenCalledWith('merged-yaml');
        // Not asserting applyQuery was never called at all - the real nested ResourceYaml's own
        // data() unflags the yaml preview on its own mount, via this same shared $router mock.
        // What matters here is that applyTemplate() itself didn't also trigger the AS-switch call.
        expect(applyQuery).not.toHaveBeenCalledWith({ [AS]: _YAML });
      });
    });

    describe('method: currentEditYaml', () => {
      it('should regenerate fresh yaml via createResourceYaml when currently showing the form', async() => {
        const { wrapper } = mountForTemplateSupport(); // showAsForm true

        await expect(wrapper.vm.currentEditYaml()).resolves.toBe('generated-resource-yaml');
      });

      it('should read the live yaml off the nested ResourceYaml ref when already showing yaml', async() => {
        const { wrapper } = mountForTemplateSupport({ [AS]: _YAML }); // showAsForm false

        (wrapper.vm.$ as any).refs = { resourceyaml: { currentYaml: 'hand-edited-yaml' } };

        await expect(wrapper.vm.currentEditYaml()).resolves.toBe('hand-edited-yaml');
      });

      it('should fall back to regenerating when already showing yaml but the ref is not available yet', async() => {
        const { wrapper } = mountForTemplateSupport({ [AS]: _YAML });

        (wrapper.vm.$ as any).refs = {};

        await expect(wrapper.vm.currentEditYaml()).resolves.toBe('generated-resource-yaml');
      });
    });
  });
});
