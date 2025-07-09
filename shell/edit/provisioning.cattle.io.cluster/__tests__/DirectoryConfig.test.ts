import { nextTick } from 'vue';
/* eslint-disable jest/no-hooks */
import { mount, Wrapper } from '@vue/test-utils';
import DirectoryConfig, { DATA_DIR_RADIO_OPTIONS, DEFAULT_SUBDIRS, DEFAULT_COMMON_BASE_PATH } from '@shell/edit/provisioning.cattle.io.cluster/tabs/DirectoryConfig.vue';
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
      k8sVersion: 'k3s',
      mode:       _CREATE,
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
    const radioInput = wrapper.find('[data-testid="rke2-directory-config-radio-input"]');
    const commonInput = wrapper.find('[data-testid="rke2-directory-config-common-data-dir"]');
    const systemAgentInput = wrapper.find('[data-testid="rke2-directory-config-systemAgent-data-dir"]');
    const provisioningInput = wrapper.find('[data-testid="rke2-directory-config-provisioning-data-dir"]');
    const k8sDistroInput = wrapper.find('[data-testid="rke2-directory-config-k8sDistro-data-dir"]');

    expect(title.exists()).toBe(true);
    expect(radioInput.exists()).toBe(true);

    // for the default config, the default radio input should be "default"
    expect(wrapper.vm.dataConfigRadioValue).toBe(DATA_DIR_RADIO_OPTIONS.DEFAULT);

    // since we have all of the vars empty, then the inputs should not be there
    expect(commonInput.exists()).toBe(false);
    expect(systemAgentInput.exists()).toBe(false);
    expect(provisioningInput.exists()).toBe(false);
    expect(k8sDistroInput.exists()).toBe(false);
  });

  it('setting the radio option to "common" should set the correct values on each data dir variable', async() => {
    const newMountOptions = clone(mountOptions);

    wrapper = mount(
      DirectoryConfig,
      {
        ...newMountOptions,
        // couldn't use setData, so this is the next best solution
        data() {
          return { dataConfigRadioValue: DATA_DIR_RADIO_OPTIONS.COMMON };
        }
      }
    );

    // update radio to the "common" option
    await wrapper.vm.handleRadioInput(DATA_DIR_RADIO_OPTIONS.COMMON);

    expect(wrapper.vm.value.systemAgent).toStrictEqual(`${ DEFAULT_COMMON_BASE_PATH }/${ DEFAULT_SUBDIRS.AGENT }`);
    expect(wrapper.vm.value.provisioning).toStrictEqual(`${ DEFAULT_COMMON_BASE_PATH }/${ DEFAULT_SUBDIRS.PROVISIONING }`);
    expect(wrapper.vm.value.k8sDistro).toStrictEqual(`${ DEFAULT_COMMON_BASE_PATH }/${ DEFAULT_SUBDIRS.K8S_DISTRO_K3S }`);
  });

  it('updating each individual data dir should set the correct values on each data dir variable', async() => {
    const newMountOptions = clone(mountOptions);

    wrapper = mount(
      DirectoryConfig,
      {
        ...newMountOptions,
        // couldn't use setData, so this is the next best solution
        data() {
          return { dataConfigRadioValue: DATA_DIR_RADIO_OPTIONS.CUSTOM };
        }
      }
    );
    const inputPath = 'some-data-dir';
    const agentValue = `${ inputPath }/${ DEFAULT_SUBDIRS.AGENT }`;
    const provisioningValue = `${ inputPath }/${ DEFAULT_SUBDIRS.PROVISIONING }`;
    const k8sDistroValue = `${ inputPath }/${ DEFAULT_SUBDIRS.K8S_DISTRO_RKE2 }`;

    const systemAgentInput = wrapper.find('[data-testid="rke2-directory-config-systemAgent-data-dir"]');
    const provisioningInput = wrapper.find('[data-testid="rke2-directory-config-provisioning-data-dir"]');
    const k8sDistroInput = wrapper.find('[data-testid="rke2-directory-config-k8sDistro-data-dir"]');

    systemAgentInput.setValue(agentValue);
    provisioningInput.setValue(provisioningValue);
    k8sDistroInput.setValue(k8sDistroValue);
    await nextTick();

    expect(wrapper.vm.value.systemAgent).toStrictEqual(agentValue);
    expect(wrapper.vm.value.provisioning).toStrictEqual(provisioningValue);
    expect(wrapper.vm.value.k8sDistro).toStrictEqual(k8sDistroValue);
  });

  it('should render the component with configuration being an empty object, without errors and radio be of value DATA_DIR_RADIO_OPTIONS.CUSTOM (edit scenario)', () => {
    const newMountOptions = clone(mountOptions);

    newMountOptions.propsData.value = {};
    newMountOptions.propsData.mode = _EDIT;

    wrapper = mount(
      DirectoryConfig,
      newMountOptions
    );

    const title = wrapper.find('h3');
    const radioInput = wrapper.find('[data-testid="rke2-directory-config-radio-input"]');
    const systemAgentInput = wrapper.find('[data-testid="rke2-directory-config-systemAgent-data-dir"]');
    const provisioningInput = wrapper.find('[data-testid="rke2-directory-config-provisioning-data-dir"]');
    const k8sDistroInput = wrapper.find('[data-testid="rke2-directory-config-k8sDistro-data-dir"]');

    expect(title.exists()).toBe(true);
    expect(radioInput.isVisible()).toBe(false);

    expect(wrapper.vm.dataConfigRadioValue).toBe(DATA_DIR_RADIO_OPTIONS.CUSTOM);

    // since we have all of the vars empty, then the inputs should not be there
    expect(systemAgentInput.exists()).toBe(true);
    expect(provisioningInput.exists()).toBe(true);
    expect(k8sDistroInput.exists()).toBe(true);

    expect(systemAgentInput.attributes().disabled).toBeDefined();
    expect(provisioningInput.attributes().disabled).toBeDefined();
    expect(k8sDistroInput.attributes().disabled).toBeDefined();
  });

  it('radio input should be set to DATA_DIR_RADIO_OPTIONS.CUSTOM with all data dir values existing and different (edit scenario)', () => {
    const newMountOptions = clone(mountOptions);
    const inputPath = 'some-data-dir';

    newMountOptions.propsData.value.systemAgent = `${ inputPath }/${ DEFAULT_SUBDIRS.AGENT }`;
    newMountOptions.propsData.value.provisioning = `${ inputPath }/${ DEFAULT_SUBDIRS.PROVISIONING }`;
    newMountOptions.propsData.value.k8sDistro = `${ inputPath }/${ DEFAULT_SUBDIRS.K8S_DISTRO_K3S }`;
    newMountOptions.propsData.mode = _EDIT;

    wrapper = mount(
      DirectoryConfig,
      newMountOptions
    );

    expect(wrapper.vm.dataConfigRadioValue).toBe(DATA_DIR_RADIO_OPTIONS.CUSTOM);

    const radioInput = wrapper.find('[data-testid="rke2-directory-config-radio-input"]');
    const systemAgentInput = wrapper.find('[data-testid="rke2-directory-config-systemAgent-data-dir"]');
    const provisioningInput = wrapper.find('[data-testid="rke2-directory-config-provisioning-data-dir"]');
    const k8sDistroInput = wrapper.find('[data-testid="rke2-directory-config-k8sDistro-data-dir"]');

    expect(radioInput.isVisible()).toBe(false);
    expect(systemAgentInput.isVisible()).toBe(true);
    expect(provisioningInput.isVisible()).toBe(true);
    expect(k8sDistroInput.isVisible()).toBe(true);

    expect(systemAgentInput.attributes().disabled).toBeDefined();
    expect(provisioningInput.attributes().disabled).toBeDefined();
    expect(k8sDistroInput.attributes().disabled).toBeDefined();

    expect(wrapper.vm.value.systemAgent).toStrictEqual(`${ inputPath }/${ DEFAULT_SUBDIRS.AGENT }`);
    expect(wrapper.vm.value.provisioning).toStrictEqual(`${ inputPath }/${ DEFAULT_SUBDIRS.PROVISIONING }`);
    expect(wrapper.vm.value.k8sDistro).toStrictEqual(`${ inputPath }/${ DEFAULT_SUBDIRS.K8S_DISTRO_K3S }`);
  });

  it('updating the k8s version for the "common" config should only update the sub dir for the k8sDistro value', async() => {
    wrapper = mount(
      DirectoryConfig,
      mountOptions
    );

    // update radio to the "common" option
    await wrapper.vm.handleRadioInput(DATA_DIR_RADIO_OPTIONS.COMMON);

    expect(wrapper.vm.value.systemAgent).toStrictEqual(`${ DEFAULT_COMMON_BASE_PATH }/${ DEFAULT_SUBDIRS.AGENT }`);
    expect(wrapper.vm.value.provisioning).toStrictEqual(`${ DEFAULT_COMMON_BASE_PATH }/${ DEFAULT_SUBDIRS.PROVISIONING }`);
    expect(wrapper.vm.value.k8sDistro).toStrictEqual(`${ DEFAULT_COMMON_BASE_PATH }/${ DEFAULT_SUBDIRS.K8S_DISTRO_K3S }`);

    // let's update the k8s version
    await wrapper.setProps({ k8sVersion: 'v1.32.4+rke2r1' });

    expect(wrapper.vm.value.k8sDistro).toStrictEqual(`${ DEFAULT_COMMON_BASE_PATH }/${ DEFAULT_SUBDIRS.K8S_DISTRO_RKE2 }`);
  });
});
