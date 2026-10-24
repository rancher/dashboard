import { shallowMount } from '@vue/test-utils';
import Basics from '@pkg/imported/components/Basics.vue';

const mountBasics = (props = {}) => {
  return shallowMount(Basics, {
    props: {
      mode:                           'edit',
      value:                          { version: { gitVersion: 'v1.30.1+rke2r1' } },
      config:                         { kubernetesVersion: 'v1.30.1+rke2r1' },
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

  it.each([
    ['control plane', 2, 'controlPlaneConcurrency'],
    ['worker', 3, 'workerConcurrency'],
  ])('should validate the %s concurrency input with the %s rules', (_, value, rulesKey) => {
    const rules = { controlPlaneConcurrency: [jest.fn()], workerConcurrency: [jest.fn()] };
    const wrapper = shallowMount(Basics, {
      props: {
        mode:                           'edit',
        value:                          { version: { gitVersion: 'v1.30.1+rke2r1' } },
        config:                         { kubernetesVersion: 'v1.30.1+rke2r1' },
        versionManagementGlobalSetting: true,
        versionManagement:              'true',
        versionManagementOld:           'true',
        upgradeStrategy:                { serverConcurrency: 2, workerConcurrency: 3 },
        rules,
      },
      global: {
        renderStubDefaultSlot: true,
        mocks:                 {
          $store: {
            getters: {
              'management/byId': () => null,
              'i18n/t':          () => (key: string) => key,
            }
          }
        }
      }
    });
    const input = wrapper.findAllComponents({ name: 'LabeledInput' }).find((c) => c.props('value') === value);

    expect(input?.props('rules')).toStrictEqual(rules[rulesKey as keyof typeof rules]);
  });

  it('should not render the Day 2 Operations config, which has its own section on the imported cluster page', () => {
    const wrapper = mountBasics();

    expect(wrapper.findComponent({ name: 'DayTwoOps' }).exists()).toBe(false);
  });

  it('should emit show-deprecated-patches-changed when the toggle changes', async() => {
    const wrapper = mountBasics();

    await wrapper.setData({ showDeprecatedPatchVersions: true });

    expect(wrapper.emitted('show-deprecated-patches-changed')).toStrictEqual([[true]]);
  });
});
