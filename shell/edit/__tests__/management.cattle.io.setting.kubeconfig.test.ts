import { shallowMount } from '@vue/test-utils';
import Settings from '@shell/edit/management.cattle.io.setting/index.vue';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { SETTING } from '@shell/config/settings';

describe('kubeconfig preferred context edit form', () => {
  it('offers ACE and Rancher proxy values as a dropdown', () => {
    const wrapper = shallowMount(Settings, {
      props: {
        value: {
          id:      SETTING.KUBECONFIG_PREFER_RANCHER_PROXY,
          value:   '',
          default: 'false'
        },
        mode: 'edit'
      },
      global: {
        stubs: { CruResource: { template: '<div><slot /></div>' } },
        mocks: {
          $store: {
            getters: {
              currentStore:              () => 'current_store',
              'current_store/schemaFor': jest.fn(),
              'current_store/all':       jest.fn(),
              'i18n/t':                  (key: string) => key,
              'i18n/exists':             jest.fn()
            },
            dispatch: jest.fn()
          },
          $route:  { query: { AS: '' } },
          $router: { applyQuery: jest.fn() },
          t:       (key: string) => key
        }
      }
    });

    expect(wrapper.findComponent(LabeledSelect).props('options')).toStrictEqual([
      { label: 'advancedSettings.enum.kubeconfig-prefer-rancher-proxy.false', value: 'false' },
      { label: 'advancedSettings.enum.kubeconfig-prefer-rancher-proxy.true', value: 'true' }
    ]);
  });
});
