import { mount } from '@vue/test-utils';
import CruResource from '@shell/components/CruResource.vue';
import {
  _CREATE, _EDIT, _VIEW, AS, _YAML
} from '@shell/config/query-params';
import TextAreaAutoGrow from '@components/Form/TextArea/TextAreaAutoGrow.vue';
import ResourceTemplateUtils from '@shell/utils/resource-template';

jest.mock('@shell/utils/resource-template', () => ({
  __esModule: true,
  default:    {
    applyTemplate:  jest.fn(),
    fetchTemplates: jest.fn().mockResolvedValue([]),
    stageFormApply: jest.fn(),
  },
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

  describe('method: onTemplateSelected', () => {
    const mockConfigMap = { metadata: { namespace: 'default', name: 'my-template' } };

    const mountForTemplate = () => {
      const dispatch = jest.fn();
      const applyQuery = jest.fn();

      const wrapper = mount(CruResource, {
        props: {
          canYaml:  false,
          mode:     _EDIT,
          resource: { type: 'apps.deployment' }
        },
        global: {
          mocks: {
            $store: {
              getters: {
                currentStore:              () => 'current_store',
                'current_store/schemaFor': jest.fn(),
                'current_store/all':       jest.fn(),
                'i18n/t':                  (key: string) => key,
                'i18n/exists':             jest.fn(),
              },
              dispatch,
            },
            $route:  { query: { AS: _YAML } },
            $router: { applyQuery },
          },
        }
      });

      return {
        wrapper, dispatch, applyQuery
      };
    };

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should prompt a confirmation modal offering both apply-to-form and apply-to-yaml', () => {
      const { wrapper, dispatch } = mountForTemplate();

      wrapper.vm.onTemplateSelected(mockConfigMap);

      expect(dispatch).toHaveBeenCalledWith('current_store/promptModal', {
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

      it('should stage the current form yaml + template, then reload the page', async() => {
        const { wrapper, dispatch } = mountForTemplate();

        jest.spyOn(wrapper.vm, 'createResourceYaml').mockResolvedValue('kind: Deployment\nmetadata:\n  name: my-edits');

        wrapper.vm.onTemplateSelected(mockConfigMap);

        const promptModalCall = dispatch.mock.calls.find((call: any[]) => call[0] === 'current_store/promptModal');
        const { applyAction } = promptModalCall![1].componentProps;

        await applyAction();

        expect(ResourceTemplateUtils.stageFormApply).toHaveBeenCalledWith(
          'kind: Deployment\nmetadata:\n  name: my-edits',
          mockConfigMap
        );
        expect(reload).toHaveBeenCalledWith();
      });
    });

    describe('apply to yaml', () => {
      it('should apply the template, switch to yaml mode and update the route when confirmed', async() => {
        (ResourceTemplateUtils.applyTemplate as jest.Mock).mockReturnValue('kind: Deployment');

        const { wrapper, dispatch, applyQuery } = mountForTemplate();

        wrapper.vm.onTemplateSelected(mockConfigMap);

        const promptModalCall = dispatch.mock.calls.find((call: any[]) => call[0] === 'current_store/promptModal');
        const { secondaryApplyAction } = promptModalCall![1].componentProps;

        await secondaryApplyAction();

        expect(ResourceTemplateUtils.applyTemplate).toHaveBeenCalledWith(wrapper.vm.resource, mockConfigMap);
        expect(wrapper.vm.resourceYaml).toBe('kind: Deployment');
        expect(wrapper.vm.showAsForm).toBe(false);
        expect(applyQuery).toHaveBeenCalledWith({ [AS]: _YAML });
      });
    });
  });
});
