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
    const systemAgentInput = wrapper.find('[data-testid="rke2-directory-config-systemAgent-data-dir"]');
    const provisioningInput = wrapper.find('[data-testid="rke2-directory-config-provisioning-data-dir"]');
    const k8sDistroInput = wrapper.find('[data-testid="rke2-directory-config-k8sDistro-data-dir"]');

    expect(title.exists()).toBe(true);

    expect(systemAgentInput.exists()).toBe(true);
    expect(provisioningInput.exists()).toBe(true);
    expect(k8sDistroInput.exists()).toBe(true);
  });

  it('updating each individual data dir should set the correct values on each data dir variable', async() => {
    wrapper = mount(
      DirectoryConfig,
      mountOptions
    );

    const inputPath = 'some-data-dir';

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

    const systemAgentInput = wrapper.find('[data-testid="rke2-directory-config-systemAgent-data-dir"]');
    const provisioningInput = wrapper.find('[data-testid="rke2-directory-config-provisioning-data-dir"]');
    const k8sDistroInput = wrapper.find('[data-testid="rke2-directory-config-k8sDistro-data-dir"]');

    expect(systemAgentInput.exists()).toBe(true);
    expect(provisioningInput.exists()).toBe(true);
    expect(k8sDistroInput.exists()).toBe(true);

    expect(systemAgentInput.attributes('disabled')).toBe('disabled');
    expect(provisioningInput.attributes('disabled')).toBe('disabled');
    expect(k8sDistroInput.attributes('disabled')).toBe('disabled');
  });
});
