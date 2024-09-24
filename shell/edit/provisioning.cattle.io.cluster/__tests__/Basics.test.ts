import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import Basics from '@shell/edit/provisioning.cattle.io.cluster/tabs/Basics.vue';
// import Checkbox from '@components/Form/Checkbox/Checkbox.vue';

const defaultStubs = {
  Banner:        true,
  LabeledSelect: true,
  YamlEditor:    true,
  Checkbox:      true
};

const defaultCiliumStubs = {
  LabeledSelect: true,
  YamlEditor:    true,
};

// const defaultComputed = {
//   showk8s21LegacyWarning() {
//     return false;
//   },
//   profileOptions() {
//     return [{ label: 'anything', value: 'anything' }];
//   }
// };

const mockAgentArgs = { 'cloud-provider-name': { options: [], profile: { options: [{ anything: 'yes' }] } } };
const mockServerArgs = { disable: {}, cni: { options: [] } };

const rke2Versions = [
  {
    id: 'v1.31.0+rke2r1', value: 'v1.31.0+rke2r1', serverArgs: mockServerArgs, agentArgs: mockAgentArgs, charts: {}
  },
  {
    id: 'v1.30.0+rke2r1', value: 'v1.30.0+rke2r1', serverArgs: mockServerArgs, agentArgs: mockAgentArgs, charts: {}
  },
  {
    id: 'v1.29.1+rke2r1', value: 'v1.29.1+rke2r1', serverArgs: mockServerArgs, agentArgs: mockAgentArgs, charts: {}
  },
  {
    id: 'v1.25.0+rke2r1', value: 'v1.25.0+rke2r1', serverArgs: mockServerArgs, agentArgs: mockAgentArgs, charts: {}
  },
  {
    id: 'v1.24.0+rke2r1', value: 'v1.24.0+rke2r1', serverArgs: mockServerArgs, agentArgs: mockAgentArgs, charts: {}
  },
  {
    id: 'v1.23.0+rke2r1', value: 'v1.23.0+rke2r1', serverArgs: mockServerArgs, agentArgs: mockAgentArgs, charts: {}
  }
];
const k3sVersions = [
  {
    id: 'v1.31.0+k3s1', value: 'v1.31.0+k3s1', serverArgs: mockServerArgs, agentArgs: mockAgentArgs, charts: {}
  },
  {
    id: 'v1.30.0+k3s1', value: 'v1.30.0+k3s1', serverArgs: mockServerArgs, agentArgs: mockAgentArgs, charts: {}
  },
  {
    id: 'v1.29.1+k3s1', value: 'v1.29.1+k3s1', serverArgs: mockServerArgs, agentArgs: mockAgentArgs, charts: {}
  },
  {
    id: 'v1.25.0+k3s1', value: 'v1.25.0+k3s1', serverArgs: mockServerArgs, agentArgs: mockAgentArgs, charts: {}
  },
  {
    id: 'v1.24.0+k3s1', value: 'v1.24.0+k3s1', serverArgs: mockServerArgs, agentArgs: mockAgentArgs, charts: {}
  },
  {
    id: 'v1.23.0+k3s1', value: 'v1.23.0+k3s1', serverArgs: mockServerArgs, agentArgs: mockAgentArgs, charts: {}
  }
];
const mockVersionOptions = [...rke2Versions, ...k3sVersions];

const defaultGetters = {
  currentStore:                     () => 'current_store',
  'management/schemaFor':           jest.fn(),
  'current_store/all':              jest.fn(),
  'i18n/t':                         jest.fn(),
  'i18n/withFallback':              jest.fn(),
  'plugins/cloudProviderForDriver': jest.fn(),
  'features/get':                   jest.fn(),
};

const defaultMocks = {
  $route: {
    name:  'anything',
    query: { AS: 'yaml' },
  },
};

const defaultSpec = {
  rkeConfig:   { etcd: { disableSnapshots: false }, machineGlobalConfig: { cni: 'calico' } },
  chartValues: {},
};

const defaultCiliumSpec = {
  rkeConfig:   { etcd: { disableSnapshots: false }, machineGlobalConfig: { cni: 'cilium' } },
  chartValues: {},
};

// ipv6
const legacyOnValue = { cilium: { ipv6: { enabled: true } } };
const legacyOffValue = { cilium: { ipv6: { enabled: false } } };
const newOnValue = { ipv6: { enabled: true } };
const newOffValue = { ipv6: { enabled: false } };

// bandwidth manager
const bmOnValue = { bandwidthManager: { enabled: true } };
const bmOffValue = { bandwidthManager: { enabled: false } };

function createBasicsTab(version : string, userChartValues: any, options = {}) {
  const k8s = mockVersionOptions.find((v) => v.id === version) || mockVersionOptions[0];
  const label = 'whatever';
  const wrapper = mount(Basics, {
    props: {
      mode:  'create',
      value: {
        spec: {
          ...defaultCiliumSpec,
          defaultPodSecurityAdmissionConfigurationTemplateName: label,
          kubernetesVersion:                                    k8s.value
        },
        agentConfig: { 'cloud-provider-name': '' },
      },
      addonVersions:               [],
      provider:                    'custom',
      userChartValues:             userChartValues || {},
      cisOverride:                 false,
      cisPsaChangeBanner:          true,
      allPsas:                     [],
      selectedVersion:             k8s,
      versionOptions:              mockVersionOptions,
      isHarvesterDriver:           false,
      isHarvesterIncompatible:     false,
      showDeprecatedPatchVersions: false,
      clusterIsAlreadyCreated:     false,
      isElementalCluster:          false,
      hasPsaTemplates:             false,
      isK3s:                       false,
      haveArgInfo:                 false,
      showCni:                     true,
      showCloudProvider:           false,
      unsupportedCloudProvider:    false,
      cloudProviderOptions:        [{ label: 'Default - RKE2 Embedded', value: '' }],
      ...options
    },

    global: {
      mocks: {
        ...defaultMocks,
        $store: { getters: defaultGetters },
      },

      stubs: defaultCiliumStubs,
    },
  });

  return wrapper;
}

describe('component: Basics', () => {
  /**
   * DISCLAIMER ***************************************************************************************
   * Logs are prevented to avoid polluting the test output.
   ****************************************************************************************************
  */
  // eslint-disable-next-line jest/no-hooks
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => { });
  });

  it.each(mockVersionOptions)('should display PSA option', (k8s) => {
    const label = 'whatever';
    const wrapper = mount(Basics, {
      props: {
        mode:  'create',
        value: {
          spec: {
            ...defaultSpec,
            defaultPodSecurityAdmissionConfigurationTemplateName: label,
            kubernetesVersion:                                    k8s.value
          },
          agentConfig: { 'cloud-provider-name': '' },
        },
        provider:                    'whatever',
        userChartValues:             {},
        cisOverride:                 false,
        cisPsaChangeBanner:          true,
        allPsas:                     [],
        selectedVersion:             k8s,
        versionOptions:              mockVersionOptions,
        isHarvesterDriver:           false,
        isHarvesterIncompatible:     false,
        showDeprecatedPatchVersions: false,
        isElementalCluster:          false,
        hasPsaTemplates:             false,
        haveArgInfo:                 false,
        showCni:                     true,
        showCloudProvider:           true,
        unsupportedCloudProvider:    false,
        cloudProviderOptions:        [{ label: 'Default - RKE2 Embedded', value: '' }],
      },

      global: {
        mocks: {
          ...defaultMocks,
          $store: { getters: defaultGetters },
        },

        stubs: defaultStubs,
      },
    });

    expect((wrapper.vm as unknown as any).psaOptions[0].label).toBe(`${ label } (Current)`);
  });

  it.each([
    ['v1.25.0+rke2r1', 'none'],
    ['v1.24.0+rke2r1', 'default'],
    ['v1.23.0+rke2r1', 'default'],
    ['v1.25.0+k3s1', 'none'],
    ['v1.24.0+k3s1', 'default'],
    ['v1.23.0+k3s1', 'default'],
  ])('should display for version %p PSA option label %p', (k8s, partialLabel) => {
    const label = `cluster.rke2.defaultPodSecurityAdmissionConfigurationTemplateName.option.${ partialLabel }`;
    const wrapper = mount(Basics, {
      props: {
        mode:  'create',
        value: {
          spec: {
            ...defaultSpec,
            defaultPodSecurityAdmissionConfigurationTemplateName: label,
            kubernetesVersion:                                    k8s
          },
          agentConfig: { 'cloud-provider-name': '' },
        },
        provider:                    'whatever',
        userChartValues:             {},
        cisOverride:                 false,
        cisPsaChangeBanner:          true,
        allPsas:                     [],
        selectedVersion:             mockVersionOptions[0],
        versionOptions:              mockVersionOptions,
        isHarvesterDriver:           false,
        isHarvesterIncompatible:     false,
        showDeprecatedPatchVersions: false,
        isElementalCluster:          false,
        hasPsaTemplates:             false,
        haveArgInfo:                 false,
        showCni:                     true,
        showCloudProvider:           true,
        unsupportedCloudProvider:    false,
        cloudProviderOptions:        [{ label: 'Default - RKE2 Embedded', value: '' }],
      },

      global: {
        mocks: {
          ...defaultMocks,
          $store: { getters: defaultGetters },
        },

        stubs: defaultStubs,
      },
    });

    expect((wrapper.vm as unknown as any).psaOptions[0].label).toStrictEqual(`${ label } (Current)`);
  });

  it.each([
    ['anything', false, false],
    ['', false, false],
  ])('given CIS profile of %p and override PSACT checkbox state of %p, it should set the PSACT dropdown as disabled %p', (cis, override, disabled) => {
    const label = 'whatever';
    const k8s = 'v1.25.0+rke2r1';
    const wrapper = mount(Basics, {
      props: {
        mode:  'create',
        value: {
          agentConfig: { profile: cis, 'cloud-provider-name': '' },
          spec:        {
            ...defaultSpec,
            defaultPodSecurityAdmissionConfigurationTemplateName: label,
            kubernetesVersion:                                    k8s
          }
        },
        provider:           'custom',
        userChartValues:    {},
        cisPsaChangeBanner: true,
        allPsas:            [],
        cisOverride:        override,
        selectedVersion:    mockVersionOptions[0],
        versionOptions:     [{
          value:     k8s,
          agentArgs: { profile: { options: [cis] } },
          charts:    {},
          profile:   { options: [cis] }
        }],
        isHarvesterDriver:           false,
        isHarvesterIncompatible:     false,
        showDeprecatedPatchVersions: false,
        isElementalCluster:          false,
        hasPsaTemplates:             true,
        haveArgInfo:                 false,
        showCni:                     true,
        showCloudProvider:           true,
        unsupportedCloudProvider:    false,
        cloudProviderOptions:        [{ label: 'Default - RKE2 Embedded', value: '' }],
      },

      global: {
        mocks: {
          ...defaultMocks,
          $store: { getters: defaultGetters },
        },

        stubs: defaultStubs,
      },
    });

    const select = wrapper.getComponent('[data-testid="rke2-custom-edit-psa"]');

    expect(select.props().disabled).toBe(disabled);
  });

  describe('cilium CNI', () => {
    it('should toggle ipv6 on/off with the legacy structure', async() => {
      const wrapper = createBasicsTab('v1.23.0+rke2r1', {});
      const ipv6Checkbox = wrapper.find('[data-testid="cluster-rke2-cni-ipv6-checkbox"]');

      expect(ipv6Checkbox.exists()).toBe(true);
      expect(ipv6Checkbox.isVisible()).toBe(true);

      // Click the checkbox - should enable ipv6
      await ipv6Checkbox.find('label').trigger('click');
      await nextTick();
      await nextTick();

      // Check and update user values with the emitted value
      let latest = (wrapper.emitted()['cilium-values-changed'] || [])[0][0];

      expect(JSON.stringify(latest)).toStrictEqual(JSON.stringify(legacyOnValue));

      await wrapper.setProps({ userChartValues: { 'rke2-cilium': latest } });

      // Click the checkbox to turn ipv6 off again
      await ipv6Checkbox.find('label').trigger('click');
      await nextTick();
      await nextTick();

      // Update from the emitted value
      latest = (wrapper.emitted()['cilium-values-changed'] || [])[1][0];

      expect(JSON.stringify(latest)).toStrictEqual(JSON.stringify(legacyOffValue));
    });

    it('should toggle ipv6 on/off with the new structure', async() => {
      const wrapper = createBasicsTab('v1.25.0+rke2r1', {});
      const ipv6Checkbox = wrapper.find('[data-testid="cluster-rke2-cni-ipv6-checkbox"]');

      expect(ipv6Checkbox.exists()).toBe(true);
      expect(ipv6Checkbox.isVisible()).toBe(true);

      // Click the checkbox - should enable ipv6
      await ipv6Checkbox.find('label').trigger('click');
      await nextTick();
      await nextTick();

      // Check and update user values with the emitted value
      let latest = (wrapper.emitted()['cilium-values-changed'] || [])[0][0];

      expect(JSON.stringify(latest)).toStrictEqual(JSON.stringify(newOnValue));

      await wrapper.setProps({ userChartValues: { 'rke2-cilium': latest } });

      // Click the checkbox to turn ipv6 off again
      await ipv6Checkbox.find('label').trigger('click');
      await nextTick();
      await nextTick();

      // Update from the emitted value
      latest = (wrapper.emitted()['cilium-values-changed'] || [])[1][0];

      expect(JSON.stringify(latest)).toStrictEqual(JSON.stringify(newOffValue));
    });

    it('should migrate when the k8s version is changed', async() => {
      const userChartValues = { 'rke2-cilium': { ipv6: { enabled: true } } };
      const wrapper = createBasicsTab('v1.25.0+rke2r1', userChartValues);

      // Check that the checkbox is checked
      const ipv6Checkbox = wrapper.find('[data-testid="cluster-rke2-cni-ipv6-checkbox"]').find('input');

      expect(ipv6Checkbox.exists()).toBe(true);
      expect(ipv6Checkbox.isVisible()).toBe(true);
      expect(ipv6Checkbox.attributes().value).toBe('true');

      // Change the kubernetes version that needs the legacy format
      const k8s123 = mockVersionOptions.find((v) => v.id === 'v1.23.0+rke2r1');

      await wrapper.setProps({ selectedVersion: k8s123 });

      let latest = (wrapper.emitted()['cilium-values-changed'] || [])[0][0];

      expect(JSON.stringify(latest)).toStrictEqual(JSON.stringify(legacyOnValue));

      // Change back the version so that the new format should be used
      const k8s125 = mockVersionOptions.find((v) => v.id === 'v1.25.0+rke2r1');

      await wrapper.setProps({ selectedVersion: k8s125 });

      latest = (wrapper.emitted()['cilium-values-changed'] || [])[1][0];
      expect(JSON.stringify(latest)).toStrictEqual(JSON.stringify(newOnValue));
    });
  });

  it('should toggle bandwidth manager support on/off', async() => {
    const wrapper = createBasicsTab('v1.25.0+rke2r1', {});
    const bmCheckbox = wrapper.find('[data-testid="cluster-rke2-cni-cilium-bandwidth-manager-checkbox"]');

    expect(bmCheckbox.exists()).toBe(true);
    expect(bmCheckbox.isVisible()).toBe(true);

    // Click the checkbox - should enable bandwidth manager
    await bmCheckbox.find('label').trigger('click');
    await nextTick();
    await nextTick();

    // Check and update user values with the emitted value
    let latest = (wrapper.emitted()['cilium-values-changed'] || [])[0][0];

    expect(JSON.stringify(latest)).toStrictEqual(JSON.stringify(bmOnValue));

    await wrapper.setProps({ userChartValues: { 'rke2-cilium': latest } });

    // Click the checkbox to turn ipv6 off again
    await bmCheckbox.find('label').trigger('click');
    await nextTick();
    await nextTick();

    // Update from the emitted value
    latest = (wrapper.emitted()['cilium-values-changed'] || [])[1][0];

    expect(JSON.stringify(latest)).toStrictEqual(JSON.stringify(bmOffValue));
  });

  it('should support ipv6 and bandwidth manager', async() => {
    const wrapper = createBasicsTab('v1.25.0+rke2r1', {});
    const bmCheckbox = wrapper.find('[data-testid="cluster-rke2-cni-cilium-bandwidth-manager-checkbox"]');
    const ipv6Checkbox = wrapper.find('[data-testid="cluster-rke2-cni-ipv6-checkbox"]');

    // Click the checkbox - should enable bandwidth manager
    await bmCheckbox.find('label').trigger('click');
    await nextTick();
    await nextTick();

    let latest = (wrapper.emitted()['cilium-values-changed'] || [])[0][0];

    await wrapper.setProps({ userChartValues: { 'rke2-cilium': latest } });

    // Click the checkbox - should enable ipv6
    await ipv6Checkbox.find('label').trigger('click');
    await nextTick();
    await nextTick();

    // Check and update user values with the emitted value
    latest = (wrapper.emitted()['cilium-values-changed'] || [])[1][0];

    const combined = {
      bandwidthManager: { enabled: true },
      ipv6:             { enabled: true }
    };

    expect(JSON.stringify(latest)).toStrictEqual(JSON.stringify(combined));

    // Check that other properties are preserved
    latest = {
      ...latest,
      bandwidthManager: {
        test:    true,
        enabled: false
      },
      ipv6: {
        test:    true,
        enabled: false
      }
    };

    await wrapper.setProps({ userChartValues: { 'rke2-cilium': latest } });

    // Click the checkbox to turn bandwidth manager off again
    await bmCheckbox.find('label').trigger('click');
    await nextTick();
    await nextTick();

    latest = (wrapper.emitted()['cilium-values-changed'] || [])[2][0];

    const expected = '{"bandwidthManager":{"test":true,"enabled":true},"ipv6":{"test":true,"enabled":false}}';

    expect(JSON.stringify(latest)).toStrictEqual(expected);
  });

  it.each([
    ['create', true, true, '%cluster.banner.cloudProviderUnsupportedAzure%'],
    ['create', false, true, undefined],
    ['create', true, false, undefined],
    ['edit', true, true, undefined],
    ['view', true, true, undefined],
  ])('should display Unsupported Azure provider warning message', (mode, showCloudProvider, isAzureProviderUnsupported, warningMessage) => {
    const wrapper = createBasicsTab('v1.31.0+rke2r1', {}, {
      mode,
      showCloudProvider,
      isAzureProviderUnsupported,
      canAzureMigrateOnEdit: true
    });

    let cloudProviderUnsupportedAzureWarningMessage;
    const warningElement = wrapper.find('[data-testid="clusterBasics__showCloudProviderUnsupportedAzureWarning"]');

    if (warningElement.exists()) {
      cloudProviderUnsupportedAzureWarningMessage = warningElement.element.textContent;
    }

    expect(cloudProviderUnsupportedAzureWarningMessage).toBe(warningMessage);
  });

  it.each([
    ['edit', true, true, '%cluster.banner.cloudProviderMigrateAzure%'],
    ['edit', false, true, undefined],
    ['edit', true, false, undefined],
    ['create', true, true, undefined],
    ['view', true, true, undefined],
  ])('should display Azure Migration warning message', (mode, showCloudProvider, canAzureMigrateOnEdit, warningMessage) => {
    const wrapper = createBasicsTab('v1.31.0+rke2r1', {}, {
      mode,
      showCloudProvider,
      canAzureMigrateOnEdit,
      isAzureProviderUnsupported: true,
    });

    let cloudProviderMigrateAzureWarningMessage;
    const warningElement = wrapper.find('[data-testid="clusterBasics__showCloudProviderMigrateAzureWarning"]');

    if (warningElement.exists()) {
      cloudProviderMigrateAzureWarningMessage = warningElement.element.textContent;
    }

    expect(cloudProviderMigrateAzureWarningMessage).toBe(warningMessage);
  });

  it.each([
    ['create', true, false],
    ['edit', false, true],
    ['edit', true, false],
    ['view', true, false],
  ])('should disable Cloud Provider', (mode, canAzureMigrateOnEdit, disabled) => {
    const wrapper = createBasicsTab('v1.31.0+rke2r1', {}, {
      mode,
      showCloudProvider: true,
      canAzureMigrateOnEdit,
    });

    const cloudProvider = wrapper.find('[data-testid="clusterBasics__cloudProvider"]');

    expect(cloudProvider.attributes().disabled).toBe(disabled.toString());
  });
});
