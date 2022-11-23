import { mount } from '@vue/test-utils';
import CruResource from '@shell/components/CruResource.vue';
import { _EDIT, _YAML } from '@shell/config/query-params';

describe('component: CruResource', () => {
  it('should hide Cancel button', () => {
    const wrapper = mount(CruResource, {
      propsData: {
        canYaml:  false,
        mode:     _EDIT,
        resource: {}
      },
      mocks: {
        $store: {
          getters: {
            currentStore:              () => 'current_store',
            'current_store/schemaFor': jest.fn(),
            'current_store/all':       jest.fn(),
            'i18n/t':                  jest.fn(),
            'i18n/exists':             jest.fn(),
          }
        },
        $route:  { query: { AS: _YAML } },
        $router: { applyQuery: jest.fn() },
      }
    });

    const element = wrapper.find('#cru-cancel').element;

    expect(element).toBeDefined();
  });

  it('should display errors', () => {
    const errors = ['mistake!', 'BiG MiStAke11'];
    const wrapper = mount(CruResource, {
      propsData: {
        canYaml:  false,
        mode:     _EDIT,
        resource: {},
        errors
      },
      components: {
        ResourceYaml:        { template: '<div></div> ' },
        ResourceCancelModal: { template: '<div></div> ' },
      },
      mocks: {
        $store: {
          getters: {
            currentStore:              () => 'current_store',
            'current_store/schemaFor': jest.fn(),
            'current_store/all':       jest.fn(),
            'i18n/t':                  jest.fn(),
            'i18n/exists':             jest.fn(),
          }
        },
        $route:  { query: { AS: _YAML } },
        $router: { applyQuery: jest.fn() },
      }
    });

    const node = wrapper.find('#cru-errors');

    expect(node.element.childElementCount).toBe(errors.length);
    expect(node.text()).toBe(`${ errors[0] } ${ errors[1] }`);
  });
});
