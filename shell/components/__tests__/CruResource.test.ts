import { mount } from '@vue/test-utils';
import CruResource from '@shell/components/CruResource.vue';
import { _CREATE, _EDIT, _VIEW, _YAML } from '@shell/config/query-params';
import TextAreaAutoGrow from '@components/Form/TextArea/TextAreaAutoGrow.vue';

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

  describe('with steps', () => {
    const steps = [
      {
        name: 'stepOne', label: 'One', ready: true
      },
      {
        name: 'stepTwo', label: 'Two', ready: false
      },
    ];

    const mountWithSteps = () => mount(CruResource, {
      props: {
        canYaml:  false,
        mode:     _CREATE,
        resource: {},
        steps,
      },

      slots: {
        stepOne: '<div class="step-one-content" />',
        stepTwo: '<div class="step-two-content" />',
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
          $route:  { query: {} },
          $router: { applyQuery: jest.fn() },
        },
      },
    });

    it('should render the step content of the active step', () => {
      const wrapper = mountWithSteps();

      expect(wrapper.find('.step-one-content').exists()).toBe(true);
      expect(wrapper.find('.step-two-content').exists()).toBe(false);
    });

    it('should point the active step tab at the panel holding its content', () => {
      const wrapper = mountWithSteps();

      const tab = wrapper.find('[role="tab"][aria-selected="true"]');
      const panel = wrapper.find(`#${ tab.attributes('aria-controls') }`);

      expect(panel.exists()).toBe(true);
      expect(panel.attributes('role')).toBe('tabpanel');
      expect(panel.find('.step-one-content').exists()).toBe(true);
    });

    it('should only hold tabs and presentational elements in the tablist', () => {
      const wrapper = mountWithSteps();
      const tablist = wrapper.find('[role="tablist"]');

      expect(tablist.exists()).toBe(true);

      // A tablist may only own tabs, so the list items around them (the step
      // wrappers and the dividers between them) have to be presentational.
      const unexpected = Array.from(tablist.element.children)
        .filter((el) => !['tab', 'presentation', 'none'].includes(el.getAttribute('role') || ''))
        .map((el) => el.outerHTML);

      expect(unexpected).toStrictEqual([]);
    });
  });
});
