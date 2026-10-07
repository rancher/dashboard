import { shallowMount } from '@vue/test-utils';
import ManagementSetting from '@shell/list/management.cattle.io.setting.vue';
import { SETTING } from '@shell/config/settings';

const setting = {
  id:               SETTING.KUBECONFIG_PREFER_RANCHER_PROXY,
  value:            '',
  default:          'false',
  availableActions: ['edit']
};

const dispatch = jest.fn();

const createWrapper = () => shallowMount(ManagementSetting, {
  global: {
    mocks: {
      $store: {
        getters: {
          'prefs/get': () => false,
          'i18n/t':    (key: string) => key
        },
        dispatch
      },
      $route: { hash: '' }
    }
  }
});

describe('kubeconfig preferred context setting', () => {
  beforeEach(() => dispatch.mockReset());

  it.each(['false', 'true'])('shows the %s setting value when the backend provides it', async(value) => {
    dispatch.mockResolvedValue([{ ...setting, value }]);
    const wrapper = createWrapper();

    await wrapper.vm.$options.fetch.call(wrapper.vm);
    await wrapper.vm.$nextTick();

    expect(wrapper.find(`#${ SETTING.KUBECONFIG_PREFER_RANCHER_PROXY }`).exists()).toStrictEqual(true);
    expect(wrapper.vm.settings[0].enum).toStrictEqual(`advancedSettings.enum.kubeconfig-prefer-rancher-proxy.${ value }`);
  });

  it('hides the setting when the backend does not provide it', async() => {
    dispatch.mockResolvedValue([]);
    const wrapper = createWrapper();

    await wrapper.vm.$options.fetch.call(wrapper.vm);
    await wrapper.vm.$nextTick();

    expect(wrapper.find(`#${ SETTING.KUBECONFIG_PREFER_RANCHER_PROXY }`).exists()).toStrictEqual(false);
  });
});
