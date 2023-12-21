import { mount } from '@vue/test-utils';
import Basics from '@shell/edit/provisioning.cattle.io.cluster/tabs/Basics';

const defaultStubs = {
  Banner:        true,
  LabeledSelect: true,
  YamlEditor:    true,
  Checkbox:      true
};

const defaultComputed = {
  showk8s21LegacyWarning() {
    return false;
  },
  profileOptions() {
    return [{ label: 'anything', value: 'anything' }];
  }
};

const mockAgentArgs = { 'cloud-provider-name': { options: [], profile: { options: [{ anything: 'yes' }] } } };
const mockServerArgs = { disable: {}, cni: { options: [] } };

const rke2Versions =
  [
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
  'plugins/cloudProviderForDriver': jest.fn()
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
      propsData: {
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
      computed: defaultComputed,
      mocks:    {
        ...defaultMocks,
        $store: { getters: defaultGetters },
      },
      stubs: defaultStubs
    });

    const select = wrapper.find('[data-testid="rke2-custom-edit-psa"]');

    expect((select.vm as unknown as any).options[0].label).toBe(`${ label } (Current)`);
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
      propsData: {
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
      computed: defaultComputed,
      mocks:    {
        ...defaultMocks,
        $store: { getters: defaultGetters },
      },
      stubs: defaultStubs
    });

    const select = wrapper.find('[data-testid="rke2-custom-edit-psa"]');

    expect((select.vm as unknown as any).options[0].label).toStrictEqual(`${ label } (Current)`);
  });

  it.each([
    ['anything', false, true],
    ['', false, false],
    ['', true, false],
  ])('given CIS value as %p and its override as %p, it should set PSA dropdown as disabled %p', (cis, override, disabled) => {
    const label = 'whatever';
    const k8s = 'v1.25.0+rke2r1';
    const wrapper = mount(Basics, {
      propsData: {
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
      computed: { ...defaultComputed },
      mocks:    {
        ...defaultMocks,
        $store: { getters: defaultGetters },
      },
      stubs: defaultStubs
    });

    const select = wrapper.find('[data-testid="rke2-custom-edit-psa"]');

    expect((select.vm as unknown as any).disabled).toBe(disabled);
  });
});
