import { shallowMount } from '@vue/test-utils';
import Basics from '@pkg/imported/components/Basics.vue';

const mountBasics = (props = {}) => {
  return shallowMount(Basics, {
    props: {
      mode:                           'edit',
      value:                          { version: { gitVersion: 'v1.30.1+rke2r1' } },
      config:                         { kubernetesVersion: 'v1.30.1+rke2r1' },
      dayTwoOpsGlobalSetting:         true,
      dayTwoOpsFlag:                  true,
      versionManagementGlobalSetting: true,
      versionManagement:              'true',
      versionManagementOld:           'true',
      ...props,
    },
    global: {
      mocks: {
        $store: {
          getters: {
            'management/byId': () => null,
            'i18n/t':          () => (key: string) => key,
          }
        }
      }
    }
  });
};

describe('component: Basics', () => {
  describe('state when (re)mounted', () => {
    it('should select the running version when no version has been picked', () => {
      const wrapper = mountBasics();

      expect(wrapper.vm.kubernetesVersion).toStrictEqual('v1.30.1+rke2r1');
    });

    it('should select the picked version over the running version', () => {
      const wrapper = mountBasics({ selectedKubernetesVersion: 'v1.31.2+rke2r1' });

      expect(wrapper.vm.kubernetesVersion).toStrictEqual('v1.31.2+rke2r1');
    });

    it('should keep the original version as the base for the version options', () => {
      const wrapper = mountBasics({ selectedKubernetesVersion: 'v1.31.2+rke2r1' });

      expect(wrapper.vm.originalVersion).toStrictEqual('v1.30.1+rke2r1');
    });

    it.each([true, false])('should start the deprecated patches toggle as %p from showDeprecatedPatches', (showDeprecatedPatches) => {
      const wrapper = mountBasics({ showDeprecatedPatches });

      expect(wrapper.vm.showDeprecatedPatchVersions).toStrictEqual(showDeprecatedPatches);
    });
  });

  it('should emit show-deprecated-patches-changed when the toggle changes', async() => {
    const wrapper = mountBasics();

    await wrapper.setData({ showDeprecatedPatchVersions: true });

    expect(wrapper.emitted('show-deprecated-patches-changed')).toStrictEqual([[true]]);
  });
});
