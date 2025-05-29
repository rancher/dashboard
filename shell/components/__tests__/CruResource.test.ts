import { mount } from '@vue/test-utils';
import CruResource from '@shell/components/CruResource.vue';
import { _EDIT, _YAML } from '@shell/config/query-params';
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
});
