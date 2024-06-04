/* eslint-disable jest/no-hooks */
import { mount, Wrapper } from '@vue/test-utils';
import DirectoryConfig from '@shell/edit/provisioning.cattle.io.cluster/tabs/DirectoryConfig.vue';
import { _EDIT, _CREATE } from '@shell/config/query-params';
import { clone } from '@shell/utils/object';

describe('component: DirectoryConfig', () => {
  let wrapper: Wrapper<InstanceType<typeof DirectoryConfig>>;

  const mountOptions = {
    propsData: {
      value: {
        systemAgent:  '',
        provisioning: '',
        k8sDistro:    '',
      },
      mode: _CREATE,
    },
    mocks: {
      $store: {
        getters: {
          'i18n/t':      jest.fn(),
          'i18n/exists': jest.fn(),
        }
      },
    }
  };

  it('should render the component with its default configuration (create scenario)', () => {
    wrapper = mount(
      DirectoryConfig,
      mountOptions
    );

    const title = wrapper.find('h3');
    const checkbox = wrapper.find('[data-testid="rke2-directory-config-individual-config-checkbox"]');
    const commonInput = wrapper.find('[data-testid="rke2-directory-config-common-data-dir"]');
    const systemAgentInput = wrapper.find('[data-testid="rke2-directory-config-systemAgent-data-dir"]');
    const provisioningInput = wrapper.find('[data-testid="rke2-directory-config-provisioning-data-dir"]');
    const k8sDistroInput = wrapper.find('[data-testid="rke2-directory-config-k8sDistro-data-dir"]');

    expect(title.exists()).toBe(true);
    expect(checkbox.exists()).toBe(true);
    // for the default config, checkbox should be checked
    expect(wrapper.vm.isSettingCommonConfig).toBe(true);
    expect(commonInput.exists()).toBe(true);

    // since we have all of the vars empty, then the individual inputs should not be there
    expect(systemAgentInput.exists()).toBe(false);
    expect(provisioningInput.exists()).toBe(false);
    expect(k8sDistroInput.exists()).toBe(false);
  });

  it('updating common config path should set the correct values on each data dir variable', async() => {
    wrapper = mount(
      DirectoryConfig,
      mountOptions
    );

    const inputPath = 'some-data-dir';
    const commonInput = wrapper.find('[data-testid="rke2-directory-config-common-data-dir"]');

    commonInput.setValue(inputPath);
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.value.systemAgent).toStrictEqual(inputPath);
    expect(wrapper.vm.value.provisioning).toStrictEqual(inputPath);
    expect(wrapper.vm.value.k8sDistro).toStrictEqual(inputPath);
  });

  it('updating each individual data dir should set the correct values on each data dir variable', async() => {
    wrapper = mount(
      DirectoryConfig,
      mountOptions
    );

    const inputPath = 'some-data-dir';
    const checkbox = wrapper.find('[data-testid="rke2-directory-config-individual-config-checkbox"]');

    await checkbox.find('label').trigger('click');
    await checkbox.vm.$nextTick();
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.isSettingCommonConfig).toBe(false);

    const systemAgentInput = wrapper.find('[data-testid="rke2-directory-config-systemAgent-data-dir"]');
    const provisioningInput = wrapper.find('[data-testid="rke2-directory-config-provisioning-data-dir"]');
    const k8sDistroInput = wrapper.find('[data-testid="rke2-directory-config-k8sDistro-data-dir"]');

    systemAgentInput.setValue(inputPath);
    provisioningInput.setValue(inputPath);
    k8sDistroInput.setValue(inputPath);
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.value.systemAgent).toStrictEqual(inputPath);
    expect(wrapper.vm.value.provisioning).toStrictEqual(inputPath);
    expect(wrapper.vm.value.k8sDistro).toStrictEqual(inputPath);
  });

  it('checkbox should be checked if all data dir values are the same (with all data dir values filled)', () => {
    const newMountOptions = clone(mountOptions);
    const inputPath = 'some-data-dir';

    newMountOptions.propsData.value.systemAgent = inputPath;
    newMountOptions.propsData.value.provisioning = inputPath;
    newMountOptions.propsData.value.k8sDistro = inputPath;

    wrapper = mount(
      DirectoryConfig,
      newMountOptions
    );

    const checkbox = wrapper.find('[data-testid="rke2-directory-config-individual-config-checkbox"]');

    expect(checkbox.exists()).toBe(true);
    expect(wrapper.vm.isSettingCommonConfig).toBe(true);

    const commonInput = wrapper.find('[data-testid="rke2-directory-config-common-data-dir"]');
    const systemAgentInput = wrapper.find('[data-testid="rke2-directory-config-systemAgent-data-dir"]');
    const provisioningInput = wrapper.find('[data-testid="rke2-directory-config-provisioning-data-dir"]');
    const k8sDistroInput = wrapper.find('[data-testid="rke2-directory-config-k8sDistro-data-dir"]');

    expect(commonInput.exists()).toBe(true);
    expect(systemAgentInput.exists()).toBe(false);
    expect(provisioningInput.exists()).toBe(false);
    expect(k8sDistroInput.exists()).toBe(false);

    expect(wrapper.vm.value.systemAgent).toStrictEqual(inputPath);
    expect(wrapper.vm.value.provisioning).toStrictEqual(inputPath);
    expect(wrapper.vm.value.k8sDistro).toStrictEqual(inputPath);
  });

  it('checkbox should NOT be checked if some data dir values are the different (with all data dir values filled)', () => {
    const newMountOptions = clone(mountOptions);
    const inputPath1 = 'some-data-dir1';
    const inputPath2 = 'some-data-dir2';
    const inputPath3 = 'some-data-dir3';

    newMountOptions.propsData.value.systemAgent = inputPath1;
    newMountOptions.propsData.value.provisioning = inputPath2;
    newMountOptions.propsData.value.k8sDistro = inputPath3;

    wrapper = mount(
      DirectoryConfig,
      newMountOptions
    );

    expect(wrapper.vm.isSettingCommonConfig).toBe(false);

    const commonInput = wrapper.find('[data-testid="rke2-directory-config-common-data-dir"]');
    const systemAgentInput = wrapper.find('[data-testid="rke2-directory-config-systemAgent-data-dir"]');
    const provisioningInput = wrapper.find('[data-testid="rke2-directory-config-provisioning-data-dir"]');
    const k8sDistroInput = wrapper.find('[data-testid="rke2-directory-config-k8sDistro-data-dir"]');

    expect(commonInput.exists()).toBe(false);
    expect(systemAgentInput.exists()).toBe(true);
    expect(provisioningInput.exists()).toBe(true);
    expect(k8sDistroInput.exists()).toBe(true);

    expect(wrapper.vm.value.systemAgent).toStrictEqual(inputPath1);
    expect(wrapper.vm.value.provisioning).toStrictEqual(inputPath2);
    expect(wrapper.vm.value.k8sDistro).toStrictEqual(inputPath3);
  });

  it('on a mode different than _CREATE all visible inputs should be disabled (with common config)', () => {
    const newMountOptions = clone(mountOptions);
    const inputPath = 'some-data-dir';

    newMountOptions.propsData.value.systemAgent = inputPath;
    newMountOptions.propsData.value.provisioning = inputPath;
    newMountOptions.propsData.value.k8sDistro = inputPath;
    newMountOptions.propsData.mode = _EDIT;

    wrapper = mount(
      DirectoryConfig,
      newMountOptions
    );

    const checkbox = wrapper.find('[data-testid="rke2-directory-config-individual-config-checkbox"]');
    const commonInput = wrapper.find('[data-testid="rke2-directory-config-common-data-dir"]');
    const systemAgentInput = wrapper.find('[data-testid="rke2-directory-config-systemAgent-data-dir"]');
    const provisioningInput = wrapper.find('[data-testid="rke2-directory-config-provisioning-data-dir"]');
    const k8sDistroInput = wrapper.find('[data-testid="rke2-directory-config-k8sDistro-data-dir"]');

    expect(checkbox.exists()).toBe(true);
    expect(commonInput.exists()).toBe(true);
    expect(systemAgentInput.exists()).toBe(false);
    expect(provisioningInput.exists()).toBe(false);
    expect(k8sDistroInput.exists()).toBe(false);

    expect(checkbox.find('label').classes('disabled')).toBe(true);
    expect(commonInput.attributes('disabled')).toBe('disabled');
  });

  it('on a mode different than _CREATE all visible inputs should be disabled (with different values)', () => {
    const newMountOptions = clone(mountOptions);
    const inputPath1 = 'some-data-dir1';
    const inputPath2 = 'some-data-dir2';
    const inputPath3 = 'some-data-dir3';

    newMountOptions.propsData.value.systemAgent = inputPath1;
    newMountOptions.propsData.value.provisioning = inputPath2;
    newMountOptions.propsData.value.k8sDistro = inputPath3;
    newMountOptions.propsData.mode = _EDIT;

    wrapper = mount(
      DirectoryConfig,
      newMountOptions
    );

    const checkbox = wrapper.find('[data-testid="rke2-directory-config-individual-config-checkbox"]');
    const commonInput = wrapper.find('[data-testid="rke2-directory-config-common-data-dir"]');
    const systemAgentInput = wrapper.find('[data-testid="rke2-directory-config-systemAgent-data-dir"]');
    const provisioningInput = wrapper.find('[data-testid="rke2-directory-config-provisioning-data-dir"]');
    const k8sDistroInput = wrapper.find('[data-testid="rke2-directory-config-k8sDistro-data-dir"]');

    expect(checkbox.exists()).toBe(true);
    expect(commonInput.exists()).toBe(false);
    expect(systemAgentInput.exists()).toBe(true);
    expect(provisioningInput.exists()).toBe(true);
    expect(k8sDistroInput.exists()).toBe(true);

    expect(checkbox.find('label').classes('disabled')).toBe(true);
    expect(systemAgentInput.attributes('disabled')).toBe('disabled');
    expect(provisioningInput.attributes('disabled')).toBe('disabled');
    expect(k8sDistroInput.attributes('disabled')).toBe('disabled');
  });
});
