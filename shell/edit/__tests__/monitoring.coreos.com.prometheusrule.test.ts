import { mount } from '@vue/test-utils';
import FormValidation from '@shell/mixins/form-validation';
import Monitoring from '@shell/edit/monitoring.coreos.com.prometheusrule/index.vue';
import { _EDIT } from '@shell/config/query-params';

describe('edit: management.cattle.io.setting should', () => {
  const MOCKED_ERRORS = ['error1', 'error2', 'error3', 'error4', 'error5'];
  const ERROR_BANNER_SELECTOR = '[data-testid="banner-close"]';
  const requiredSetup = () => ({
    // Remove all these mocks after migration to Vue 2.7/3 due mixin logic
    global: {
      mocks: {
        $store: {
          dispatch: jest.fn(),
          getters:  {
            currentStore:              () => 'current_store',
            'current_store/schemaFor': jest.fn(),
            'current_store/all':       jest.fn(),
            'i18n/t':                  jest.fn(),
            'i18n/exists':             jest.fn(),
            namespaces:                () => ({})
          }
        },
        $route:  { query: { AS: '' }, name: '' },
        $router: { applyQuery: jest.fn() }
      }
    }
  });

  it('should close error banners', async() => {
    jest.spyOn(FormValidation.computed, 'fvUnreportedValidationErrors').mockReturnValue(MOCKED_ERRORS);

    const wrapper = mount(Monitoring, {
      props: {
        canYaml:  false,
        mode:     _EDIT,
        resource: {},
        value:    { value: 'anything' },
        name:     ''
      },
      ...requiredSetup()
    });

    const errorBanners = wrapper.findAll(ERROR_BANNER_SELECTOR);

    // Assert that all the error banners are rendered
    expect(errorBanners).toHaveLength(MOCKED_ERRORS.length);

    for (let i = 0; i < MOCKED_ERRORS.length; i++) {
      await errorBanners.at(0).trigger('click');
      const resultErrorBanners = wrapper.findAll(ERROR_BANNER_SELECTOR);

      // Assert that an error banner is closed until the last one
      expect(resultErrorBanners).toHaveLength(MOCKED_ERRORS.length - 1 - i);
    }
  });
});
