/* eslint-disable jest/no-mocks-import */
import flushPromises from 'flush-promises';
import { shallowMount, VueWrapper, mount } from '@vue/test-utils';
import { EKSConfig } from 'types';
import Config from '@pkg/eks/components/Config.vue';
import listKeysResponseData from '../__mocks__/listKeys';
import describeAddonVersionsResponseData from '../__mocks__/describeAddonVersions';
import versionsFallbackData from '../../assets/data/eks-versions';
import { _EDIT } from '@shell/config/query-params';

const mockedValidationMixin = {
  computed: {
    fvFormIsValid:                jest.fn(),
    type:                         jest.fn(),
    fvUnreportedValidationErrors: jest.fn(),
  },
  methods: { fvGetAndReportPathRules: jest.fn() }
};

const mockedStore = (versionSetting: any) => {
  return {
    getters: {
      'i18n/t':               (text: string) => text,
      t:                      (text: string) => text,
      currentStore:           () => 'current_store',
      'management/schemaFor': jest.fn(),
      'rancher/create':       () => {},
      'management/byId':      (_id: string) => {
        return versionSetting;
      },
    },
    dispatch: () => {
      return {
        listKeys: () => {
          return listKeysResponseData;
        },
        describeAddonVersions: () => {
          return describeAddonVersionsResponseData;
        }

      };
    }
  };
};

const mockedRoute = { query: {} };

const requiredSetup = (versionSetting = { value: '<=1.27.x' }) => {
  return {
    mocks: {
      $store:      mockedStore(versionSetting),
      $route:      mockedRoute,
      $fetchState: {},
    }
  };
};

const setCredential = async(wrapper: VueWrapper<any>, config = {} as EKSConfig) => {
  config.amazonCredentialSecret = 'foo';
  config.region = 'bar';
  await wrapper.setProps({ config: { ...config } });
  await flushPromises();
};

describe('eKS K8s configuration', () => {
  it('should load eks versions and kms keys when the credential or region is set', async() => {
    const setup = requiredSetup();
    const spy = jest.spyOn(setup.mocks.$store, 'dispatch');

    const wrapper = mount(
      Config,
      {
        propsData: {
          config: {
            amazonCredentialSecret: '',
            region:                 ''
          }

        },
        global: { ...setup }
      });

    expect(wrapper.exists()).toBe(true);
    expect(spy).toHaveBeenCalledTimes(0);
    await setCredential(wrapper);

    expect(spy).toHaveBeenCalledWith('aws/eks', { cloudCredentialId: 'foo', region: 'bar' });
    expect(spy).toHaveBeenCalledWith('aws/kms', { cloudCredentialId: 'foo', region: 'bar' });
  });

  it('should re-load eks versions and kms keys when the region is changed', async() => {
    const setup = requiredSetup();
    const spy = jest.spyOn(setup.mocks.$store, 'dispatch');

    const wrapper = shallowMount(
      Config,
      {
        props: {
          config: {
            amazonCredentialSecret: '',
            region:                 ''
          }
        },
        global: { ...setup }
      });

    expect(wrapper.exists()).toBe(true);
    expect(spy).toHaveBeenCalledTimes(0);
    await setCredential(wrapper);
    expect(spy).toHaveBeenCalledTimes(4);

    wrapper.setProps({ config: { amazonCredentialSecret: 'foo', region: 'rab' } });
    await flushPromises();
    expect(spy).toHaveBeenCalledTimes(6);
    expect(spy).toHaveBeenCalledWith('aws/eks', { cloudCredentialId: 'foo', region: 'rab' });
    expect(spy).toHaveBeenCalledWith('aws/kms', { cloudCredentialId: 'foo', region: 'rab' });
  });

  it('should re-load eks versions and kms keys when the credential is changed', async() => {
    const setup = requiredSetup();
    const spy = jest.spyOn(setup.mocks.$store, 'dispatch');

    const wrapper = shallowMount(
      Config,
      {
        propsData: {
          config: {
            amazonCredentialSecret: '',
            region:                 ''
          }
        },
        global: { ...setup }
      });

    expect(spy).toHaveBeenCalledTimes(0);
    await setCredential(wrapper);
    expect(spy).toHaveBeenCalledTimes(4);

    wrapper.setProps({ config: { amazonCredentialSecret: 'oof', region: 'bar' } });
    await flushPromises();
    expect(spy).toHaveBeenCalledTimes(6);
    expect(spy).toHaveBeenCalledWith('aws/eks', { cloudCredentialId: 'oof', region: 'bar' });
    expect(spy).toHaveBeenCalledWith('aws/kms', { cloudCredentialId: 'oof', region: 'bar' });
  });

  it('should set the cluster kubernetes version to the latest available version after versions have been loaded', async() => {
    const setup = requiredSetup({ value: '>=1.25' });

    const wrapper = shallowMount(
      Config,
      {
        propsData: {
          config: {
            amazonCredentialSecret: '',
            region:                 ''
          }
        },
        global: { ...setup }
      });

    // when the component loads initially it uses fallback data for k8s versions
    expect(wrapper.emitted('update:kubernetesVersion')?.[0]?.[0]).toBe(versionsFallbackData[0]);
    expect(wrapper.emitted('update:kubernetesVersion')).toHaveLength(1);

    await setCredential(wrapper);

    // once a credential is provided, the component fetches k8s versions from aws api - ensure that it updates the default version to the latest from THIS data set instead
    expect(wrapper.emitted('update:kubernetesVersion')?.[1]?.[0]).toBe('2.0');
    expect(wrapper.emitted('update:kubernetesVersion')).toHaveLength(2);
  });

  it('should not update the cluster kubernetes version upon fetching version data if editing a cluster with version already set', async() => {
    const setup = requiredSetup({ value: '>=1.25' });

    const wrapper = shallowMount(Config, {
      propsData: {
        config:            { amazonCredentialSecret: '', region: '' },
        kubernetesVersion: '1.23',
        mode:              _EDIT
      },
      global: { ...setup }
    });

    // make sure the version isn't overwritten with fallback version data
    expect(wrapper.emitted('update:kubernetesVersion')).toBeUndefined();

    // make sure that when the version list is fetched from api, the cluster version isnt overwritten then either
    await setCredential(wrapper);

    expect(wrapper.emitted('update:kubernetesVersion')).toBeUndefined();
  });

  it('should show an input for a KMS key when the encrypt secrets checkbox is checked', async() => {
    const setup = requiredSetup();

    const wrapper = shallowMount(
      Config,
      {
        propsData: {
          config: {
            amazonCredentialSecret: '',
            region:                 ''
          }
        },
        global: { ...setup }
      });

    await setCredential(wrapper);
    expect(wrapper.exists()).toBe(true);

    let kmsDropdown = wrapper.find('[data-testid="eks-kms-dropdown"]');
    let kmsTextInput = wrapper.find('[data-testid="eks-kms-input"]');

    expect(kmsTextInput.exists()).toBe(false);
    expect(kmsDropdown.exists()).toBe(false);

    wrapper.setData({ canReadKms: true });
    wrapper.setProps({ secretsEncryption: true });

    await wrapper.vm.$nextTick();
    kmsDropdown = wrapper.find('[data-testid="eks-kms-dropdown"]');
    kmsTextInput = wrapper.find('[data-testid="eks-kms-input"]');

    expect(kmsTextInput.exists()).toBe(false);
    expect(kmsDropdown.exists()).toBe(true);
  });

  it('should update the secretsEncryption prop when the kms key checkbox is checked', async() => {
    const setup = requiredSetup();

    const wrapper = shallowMount(
      Config,
      {
        propsData: {
          config: {
            amazonCredentialSecret: '',
            region:                 ''
          }
        },
        global: { ...setup }
      });

    wrapper.setData({ canReadKms: true });

    await setCredential(wrapper);

    expect(wrapper.emitted('update:secretsEncryption')).toBeUndefined();

    const secretsEncryptionCheckbox = wrapper.getComponent('[data-testid="eks-secrets-encryption-checkbox"]');

    secretsEncryptionCheckbox.vm.$emit('update:value', true);
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted('update:secretsEncryption')).toHaveLength(1);
    expect(wrapper.emitted('update:secretsEncryption')?.[0]?.[0]).toBe(true);

    secretsEncryptionCheckbox.vm.$emit('update:value', false);
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted('update:secretsEncryption')).toHaveLength(2);
    expect(wrapper.emitted('update:secretsEncryption')?.[1]?.[0]).toBe(false);
  });

  it('should set the kmsKey to an empty string if secretsEncryption is disabled', async() => {
    const setup = requiredSetup();

    const wrapper = shallowMount(Config, {
      propsData: {
        config:            { amazonCredentialSecret: '', region: '' },
        secretsEncryption: true,
        kmsKey:            '123abc'
      },
      global: { ...setup }
    });

    await setCredential(wrapper);
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.emitted('update:kmsKey')).toBeUndefined();

    wrapper.setData({ canReadKms: true });
    wrapper.setProps({ secretsEncryption: false });

    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('update:kmsKey')).toHaveLength(1);
    expect(wrapper.emitted('update:kmsKey')?.[0]?.[0]).toBe('');
  });

  // load kms key arn into dropdown
  it('should populate a dropdown with kms key arns from aws api call', async() => {
    const setup = requiredSetup();

    const wrapper = shallowMount(Config, {
      propsData: {
        config:            { amazonCredentialSecret: '', region: '' },
        secretsEncryption: true,
        kmsKey:            '123abc'
      },
      global: { ...setup }
    });

    await setCredential(wrapper);
    const kmsDropdown = wrapper.getComponent('[data-testid="eks-kms-dropdown"]');

    expect(kmsDropdown.props().options).toStrictEqual(['arn:aws:kms:us-west-2:testdata2134',
      'arn:aws:kms:us-west-2:testdata6543',
      'arn:aws:kms:us-west-2:testdata3454',
      'arn:aws:kms:us-west-2:testdata8762']);
  });

  // set canReadKms false if data fetch fails; show text input for kmsKey instead
  it('should show a text input for kms key arns if no data if the api call throws an error', async() => {
    const failingStoreMock = {
      ...mockedStore({ value: '<=1.27.x' }),
      dispatch: () => {
        return {
          listKeys: () => {
            throw new Error('failed to load keys blah blah');
          },
          describeAddonVersions: () => {
            return describeAddonVersionsResponseData;
          }

        };
      }
    };

    const setup = {
      mixins: [mockedValidationMixin],
      mocks:  {
        $store:      failingStoreMock,
        $route:      mockedRoute,
        $fetchState: {},
      }
    };

    const wrapper = shallowMount(Config, {
      propsData: {
        config:            { amazonCredentialSecret: '', region: '' },
        secretsEncryption: true,
        kmsKey:            '123abc'
      },
      global: { ...setup }
    });

    await setCredential(wrapper);

    expect(wrapper.exists()).toBe(true);

    expect(wrapper.vm.canReadKms).toBe(false);
    const kmsDropdown = wrapper.find('[data-testid="eks-kms-dropdown"]');

    expect(kmsDropdown.exists()).toBe(false);

    const kmsTextInput = wrapper.find('[data-testid="eks-kms-input"]');

    expect(kmsTextInput.exists()).toBe(true);
  });

  it('should show an input for service role if the custom service role radio option is selected', async() => {
    const setup = requiredSetup();

    const wrapper = shallowMount(
      Config,
      {
        propsData: {
          config: {
            amazonCredentialSecret: '',
            region:                 ''
          }
        },
        global: { ...setup }
      });

    await setCredential(wrapper);
    expect(wrapper.exists()).toBe(true);
    wrapper.setData({ customServiceRole: false });
    let serviceRoleDropdown = wrapper.find('[data-testid="eks-service-role-dropdown"]');

    expect(serviceRoleDropdown.exists()).toBe(false);
    wrapper.setData({ customServiceRole: true });
    serviceRoleDropdown = wrapper.find('[data-testid="eks-service-role-dropdown"]');

    expect(serviceRoleDropdown.exists()).toBe(false);
  });

  it('should not allow kubernetes downgrades', async() => {
    const setup = requiredSetup();

    const wrapper = shallowMount(Config, {
      propsData: {
        config:          { amazonCredentialSecret: '', region: '' },
        originalVersion: '1.26'
      },
      global: { ...setup }
    });

    await setCredential(wrapper);
    expect(wrapper.exists()).toBe(true);

    let versionOptions = wrapper.getComponent('[data-testid="eks-version-dropdown"]').vm.options;

    expect(versionOptions).not.toContain('1.25');
    wrapper.setProps({ originalVersion: '1.27' });
    await wrapper.vm.$nextTick();
    versionOptions = wrapper.getComponent('[data-testid="eks-version-dropdown"]').vm.options;
    expect(versionOptions).not.toContain('1.26');
  });

  it.each([
    ['>1.24', ['2.0', '1.29', '1.28', '1.27', '1.26', '1.25']],
    ['>1.26', ['2.0', '1.29', '1.28', '1.27']]
  ])('should only show kubernetes versions within the supported version range global setting', async(versionSettingValue, expectedVersions) => {
    const setup = requiredSetup({ value: versionSettingValue });

    const wrapper = shallowMount(
      Config,
      {
        propsData: {
          config: {
            amazonCredentialSecret: '',
            region:                 ''
          }
        },
        global: { ...setup }
      });

    await setCredential(wrapper);
    expect(wrapper.exists()).toBe(true);
    const versionOptions = (wrapper.getComponent('[data-testid="eks-version-dropdown"]').vm.options || []).map((opt: {label: string, value: string, disabled?:boolean}) => opt.value);

    expect(versionOptions).toStrictEqual(expectedVersions);
  });

  it.each([
    ['1.26', ['1.27', '1.26'], ['2.0', '1.29', '1.28']],
    ['1.25', ['1.26', '1.25'], ['2.0', '1.29', '1.28', '1.27']],
  ])('should only allow the user to select a kubernetes version within one minor version of the current version when editing', async(originalVersion, enabledVersions, disabledVersions) => {
    const setup = requiredSetup({ value: '>1.24' });
    const wrapper = shallowMount(Config, {
      propsData: {
        config: { amazonCredentialSecret: '', region: '' },
        originalVersion
      },
      global: { ...setup }
    });

    await setCredential(wrapper);

    const versionOptions = wrapper.getComponent('[data-testid="eks-version-dropdown"]').vm.options || [];

    expect(versionOptions.filter((opt: {label: string, value: string, disabled?:boolean}) => opt.disabled).map((opt: {label: string, value: string, disabled?:boolean}) => opt.value)).toStrictEqual(disabledVersions);

    expect(versionOptions.filter((opt: {label: string, value: string, disabled?:boolean}) => !opt.disabled).map((opt: {label: string, value: string, disabled?:boolean}) => opt.value)).toStrictEqual(enabledVersions);
  });

  it('should not allow the user to upgrade if any node groups are of a lower version', async() => {
    const setup = requiredSetup({ value: '>1.24' });
    const eksConfig: EKSConfig = {
      amazonCredentialSecret: '', region: '', nodeGroups: [{ version: '1.27' }, { version: '1.25' }]
    };
    const wrapper = mount(Config, {
      propsData: {
        config:          eksConfig,
        originalVersion: '1.27',
      },
      global: { ...setup }
    });

    await setCredential(wrapper, eksConfig);
    const versionDropdown = wrapper.getComponent('[data-testid="eks-version-dropdown"]');

    const upgradesDisallowedBanner = wrapper.getComponent('[data-testid="eks-version-upgrade-disallowed-banner"]');

    expect(versionDropdown.props().disabled).toBe(true);
    expect(upgradesDisallowedBanner.isVisible()).toBe(true);
  });

  // setting/unsetting _isUpgrading is tested in ./NodeGroup.test.ts
  it('should not allow the user to upgrade if any node groups are currently being upgraded', async() => {
    const setup = requiredSetup({ value: '>1.24' });
    const eksConfig: EKSConfig = {
      amazonCredentialSecret: '', region: '', nodeGroups: [{ version: '1.27' }, { version: '1.27', _isUpgrading: true }]
    };
    const wrapper = shallowMount(Config, {
      propsData: {
        config:          eksConfig,
        originalVersion: '1.27',
      },
      global: { ...setup }
    });

    await setCredential(wrapper, eksConfig);
    const versionDropdown = wrapper.getComponent('[data-testid="eks-version-dropdown"]');
    const upgradesDisallowedBanner = wrapper.getComponent('[data-testid="eks-version-upgrade-disallowed-banner"]');

    expect(versionDropdown.props().disabled).toBe(true);
    expect(upgradesDisallowedBanner.isVisible()).toBe(true);
  });

  it('should allow the user to upgrade if all node groups are the same version as the current cluster version', async() => {
    const setup = requiredSetup({ value: '>1.24' });
    const eksConfig: EKSConfig = {
      amazonCredentialSecret: '', region: '', nodeGroups: [{ version: '1.27' }, { version: '1.27' }]
    };
    const wrapper = shallowMount(Config, {
      propsData: {
        config:          eksConfig,
        originalVersion: '1.27',
      },
      global: { ...setup }
    });

    await setCredential(wrapper);

    const versionDropdown = wrapper.getComponent('[data-testid="eks-version-dropdown"]');
    const upgradesDisallowedBanner = wrapper.findComponent('[data-testid="eks-version-upgrade-disallowed-banner"]');

    expect(versionDropdown.props().disabled).toBe(false);
    expect(upgradesDisallowedBanner.exists()).toBe(false);
  });
});
