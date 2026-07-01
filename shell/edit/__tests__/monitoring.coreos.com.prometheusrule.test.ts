import { mount, shallowMount } from '@vue/test-utils';
import FormValidation from '@shell/mixins/form-validation';
import Monitoring from '@shell/edit/monitoring.coreos.com.prometheusrule/index.vue';
import { _CREATE, _EDIT } from '@shell/config/query-params';
import { createStore } from 'vuex';

describe('edit: management.cattle.io.setting should', () => {
  const MOCKED_ERRORS = ['error1', 'error2', 'error3', 'error4', 'error5'];
  const ERROR_BANNER_SELECTOR = '[data-testid="banner-close"]';
  const store = createStore({
    getters: {
      namespaces:                () => () => ({}),
      currentStore:              () => () => 'current_store',
      'current_store/schemaFor': () => jest.fn()
    }
  });
  const requiredSetup = () => ({
    // Remove all these mocks after migration to Vue 2.7/3 due mixin logic
    global: {
      provide: { store },
      mocks:   {
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
        value:    {
          setAnnotation: jest.fn(),
          value:         'anything',
          metadata:      {},
        },
        name: ''
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

describe('edit: monitoring.coreos.com.prometheusrule created hook', () => {
  const store = createStore({
    getters: {
      namespaces:                () => () => ({}),
      currentStore:              () => () => 'current_store',
      'current_store/schemaFor': () => jest.fn()
    }
  });

  const requiredSetup = () => ({
    global: {
      provide: { store },
      mocks:   {
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

  const makeSetLabel = (value: any) => jest.fn((key: string, val: string) => {
    if (!value.metadata.labels) {
      value.metadata.labels = {};
    }
    value.metadata.labels[key] = val;
  });

  it('should set default namespace and release label in CREATE mode', () => {
    const value: any = { metadata: {} };

    value.setLabel = makeSetLabel(value);

    shallowMount(Monitoring, {
      props: { mode: _CREATE, value },
      ...requiredSetup()
    });

    expect(value.metadata.namespace).toBe('cattle-monitoring-system');
    expect(value.setLabel).toHaveBeenCalledWith('release', 'kube-prometheus-stack');
    expect(value.metadata.labels?.release).toBe('kube-prometheus-stack');
  });

  it('should not override an existing release label in CREATE mode', () => {
    const value: any = { metadata: { labels: { release: 'custom-release' } } };

    value.setLabel = makeSetLabel(value);

    shallowMount(Monitoring, {
      props: { mode: _CREATE, value },
      ...requiredSetup()
    });

    expect(value.setLabel).not.toHaveBeenCalled();
    expect(value.metadata.labels.release).toBe('custom-release');
  });

  it('should not set default namespace or release label in EDIT mode', () => {
    const value: any = { metadata: {}, setLabel: jest.fn() };

    shallowMount(Monitoring, {
      props: { mode: _EDIT, value },
      ...requiredSetup()
    });

    expect(value.metadata.namespace).toBeUndefined();
    expect(value.setLabel).not.toHaveBeenCalled();
  });
});
