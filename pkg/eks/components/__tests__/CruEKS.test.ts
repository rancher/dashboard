/* eslint-disable jest/no-mocks-import */
import flushPromises from 'flush-promises';
import { mount, shallowMount, Wrapper } from '@vue/test-utils';
import { EKSConfig, EKSNodeGroup } from 'types';
import CruEKS, { DEFAULT_EKS_CONFIG } from '@pkg/eks/components/CruEKS.vue';
import describeKeyPairs from '../__mocks__/describeKeyPairs';
import describeLaunchTemplates from '../__mocks__/describeLaunchTemplates';

const mockedStore = (versionSetting: any) => {
  return {
    getters: {
      'i18n/t':                  (text: string) => text,
      t:                         (text: string) => text,
      currentStore:              () => 'current_store',
      'current_store/schemaFor': jest.fn(),
      'current_store/all':       jest.fn(),
      'management/byId':         () => {
        return versionSetting;
      },
      'management/schemaFor': jest.fn(),
      'rancher/create':       () => {
        return {};
      }
    },

    dispatch: (ctx: any, { cmd }:{cmd?:string}) => {
      switch (cmd) {
      case 'describeLaunchTemplates':
        return describeLaunchTemplates.LaunchTemplates;
      case 'listRoles':
        return [];
      default:
        return {
          describeKeyPairs: () => {
            return describeKeyPairs;
          }
        };
      }
    }
  };
};

const mockedRoute = { query: {} };

const requiredSetup = (versionSetting = { value: '<=1.27.x' }) => {
  return {
    global: {
      mocks: {
        $store:      mockedStore(versionSetting),
        $route:      mockedRoute,
        $fetchState: {},
      },
      stubs: { CruResource: false, Accordion: false }
    }
  };
};

const setCredential = async(wrapper :Wrapper<any>, config = {} as EKSConfig) => {
  wrapper.setData({ config });
  wrapper.vm.updateCredential('foo');
  wrapper.vm.updateRegion('bar');
  await flushPromises();
};

describe('eKS provisioning form', () => {
  it('should hide the form if no credential is selected', () => {
    const wrapper = shallowMount(CruEKS, { propsData: { value: {}, mode: 'create' }, ...requiredSetup() });

    const form = wrapper.find('[data-testid="crueks-form"]');

    expect(form.exists()).toBe(false);
  });

  it('should show the form when a credential is selected', async() => {
    const wrapper = mount(CruEKS, {
      propsData: { value: {}, mode: 'create' },
      ...requiredSetup(),
      shallow:   true
    });

    const formSelector = '[data-testid="crueks-form"]';

    expect(wrapper.find(formSelector).exists()).toBe(false);

    await setCredential(wrapper);
    expect(wrapper.find(formSelector).exists()).toBe(true);
  });

  it('should not use form validation if no credential is selected', async() => {
    const wrapper = shallowMount(CruEKS, {
      propsData: { value: {}, mode: 'create' },
      ...requiredSetup()
    });

    let fvRules = wrapper.vm.fvExtraRules;

    expect(fvRules).toStrictEqual({});

    await setCredential(wrapper);
    await wrapper.vm.$nextTick();

    fvRules = wrapper.vm.fvExtraRules;

    expect(Object.keys(fvRules).length).toBeGreaterThan(0);
  });

  it('should update both cluster.name and config.displayName when the name input is altered', async() => {
    const wrapper = shallowMount(CruEKS, {
      propsData: { value: {}, mode: 'create' },
      ...requiredSetup()
    });

    const formSelector = '[data-testid="crueks-form"]';

    expect(wrapper.find(formSelector).exists()).toBe(false);

    await setCredential(wrapper);

    const nameInput = wrapper.getComponent('[data-testid="eks-name-input"]');

    nameInput.vm.$emit('update:value', 'abc');
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.config.displayName).toStrictEqual('abc');
    expect(wrapper.vm.normanCluster.name).toStrictEqual('abc');
    expect(nameInput.props().value).toStrictEqual('abc');

    nameInput.vm.$emit('update:value', 'def');
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.config.displayName).toStrictEqual('def');
    expect(wrapper.vm.normanCluster.name).toStrictEqual('def');
    expect(nameInput.props().value).toStrictEqual('def');
  });

  it('should set _isNew to true when a pool is added', async() => {
    const wrapper = shallowMount(CruEKS, {
      propsData: { value: {}, mode: 'edit' },
      ...requiredSetup()
    });

    wrapper.setData({ nodeGroups: [{ name: 'abc' }] });
    wrapper.vm.addGroup();
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.nodeGroups).toHaveLength(2);
    expect(wrapper.vm.nodeGroups.filter((group: EKSNodeGroup) => !group._isNew)).toHaveLength(1);
  });

  it('should update new node pools\' version when cluster version is updated', async() => {
    const wrapper = shallowMount(CruEKS, {
      propsData: { value: {}, mode: 'edit' },
      ...requiredSetup()
    });

    wrapper.setData({ nodeGroups: [{ name: 'abc' }] });
    wrapper.vm.addGroup();
    await wrapper.vm.$nextTick();

    wrapper.setData({ config: { kubernetesVersion: '1.24' } });

    await wrapper.vm.$nextTick();

    expect(wrapper.vm.nodeGroups.filter((group: EKSNodeGroup) => group.version === '1.24')).toHaveLength(1);
  });

  it('should configure enable network policy at the cluster level not within eksConfig', async() => {
    const wrapper = shallowMount(CruEKS, {
      propsData: { value: {}, mode: 'edit' },
      ...requiredSetup()
    });

    await setCredential(wrapper);

    const configComponent = wrapper.getComponent('[data-testid="eks-config-section"]');

    configComponent.vm.$emit('update:enableNetworkPolicy', true);

    await wrapper.vm.$nextTick();
    expect(wrapper.vm.normanCluster.enableNetworkPolicy).toBe(true);

    configComponent.vm.$emit('update:enableNetworkPolicy', false);

    await wrapper.vm.$nextTick();
    expect(wrapper.vm.normanCluster.enableNetworkPolicy).toBe(false);

    wrapper.setData({ normanCluster: { ...wrapper.vm.normanCluster, enableNetworkPolicy: true } });
    await wrapper.vm.$nextTick();

    expect(configComponent.props().enableNetworkPolicy).toBe(true);
  });

  it('should show an error and prevent saving if no node groups are defined', async() => {
    const wrapper = shallowMount(CruEKS, {
      propsData: { value: {}, mode: 'create' },
      ...requiredSetup()
    });

    await setCredential(wrapper, { ...DEFAULT_EKS_CONFIG });
    wrapper.vm.addGroup();

    const nameInput = wrapper.getComponent('[data-testid="eks-name-input"]');

    nameInput.vm.$emit('input', 'abc');
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.fvUnreportedValidationErrors).toStrictEqual([]);

    wrapper.vm.removeGroup(0);

    expect(wrapper.vm.nodeGroups).toStrictEqual([]);

    expect(wrapper.vm.fvFormIsValid).toBe(false);
    expect(wrapper.vm.fvUnreportedValidationErrors).toStrictEqual(['eks.errors.nodeGroupsRequired']);
  });

  it('should NOT show an error nor prevent saving if no node groups are defined in an IMPORTED cluster', async() => {
    const wrapper = mount(CruEKS, {
      propsData: { value: {}, mode: 'edit' },
      ...requiredSetup(),
      shallow:   true,
    });

    await setCredential(wrapper, { ...DEFAULT_EKS_CONFIG, imported: true });
    wrapper.vm.addGroup();

    const nameInput = wrapper.getComponent('[data-testid="eks-name-input"]');

    nameInput.vm.$emit('update:value', 'abc');
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.fvUnreportedValidationErrors).toStrictEqual([]);

    wrapper.vm.removeGroup(0);

    expect(wrapper.vm.nodeGroups).toStrictEqual([]);
    expect(wrapper.vm.fvFormIsValid).toBe(true);

    expect(wrapper.vm.fvUnreportedValidationErrors).toStrictEqual([]);
  });

  it('should fetch ssh keys from the aws api and save response as list of keypair KeyNames', async() => {
    const setup = requiredSetup();

    const wrapper = shallowMount(CruEKS, {
      propsData: { value: {}, mode: 'create' },
      ...setup
    });

    await setCredential(wrapper);

    expect(wrapper.vm.sshKeyPairs).toStrictEqual(['test-key1', 'test-key2']);
  });
});
