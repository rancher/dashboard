import { mount } from '@vue/test-utils';
import BannerSettings from '@shell/components/form/BannerSettings.vue';

describe('view: management.cattle.io.setting should', () => {
  const requiredSetup = () => ({
    mocks: {
      $fetchState: { pending: false },
      $store:      {
        getters: {
          currentStore:              () => 'current_store',
          currentCluster:            { id: 'local' },
          currentProduct:            { inStore: 'cluster' },
          isExplorer:                false,
          'management/schemaFor':    jest.fn(),
          'current_store/schemaFor': jest.fn(),
          'current_store/all':       jest.fn(),
          'i18n/t':                  jest.fn(),
          'i18n/exists':             jest.fn(),
          'prefs/get':               () => {},
        },
        dispatch: jest.fn(),
      },
      $route:  { query: { AS: '' } },
      $router: { applyQuery: jest.fn() },
    }
  });

  it('allowing to save if no rules in settings', () => {
    const wrapper = mount(BannerSettings, {
      stubs:     { TypeDescription: true },
      propsData: {
        value:      { foo: { text: '' } },
        mode:       'view',
        bannerType: 'foo'
      },
      computed: { hideDescriptions: () => true },
      data:     () => ({
        vendor:      'Rancher',
        uiPLSetting: { vendor: 'Rancher' },

        uiBannerSetting: null,
        bannerVal:       {},

        errors: [],
      }),
      ...requiredSetup()
    });

    const colorInputPreview = wrapper.find('[data-testid="color-input-color-input_preview-container"]');

    expect(colorInputPreview.element.style.display).not.toBe('flex');
  });
});
