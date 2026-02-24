import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import Basics from '@shell/edit/provisioning.cattle.io.cluster/tabs/Basics.vue';
// import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import { RKE2_INGRESS_NGINX, RKE2_TRAEFIK } from '@shell/edit/provisioning.cattle.io.cluster/shared';

const defaultStubs = {
  Banner:          true,
  LabeledSelect:   true,
  YamlEditor:      true,
  Checkbox:        true,
  RichTranslation: true
};

const defaultCiliumStubs = {
  LabeledSelect:   true,
  YamlEditor:      true,
  RichTranslation: true
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
const mockServerArgs = { disable: { options: [] }, cni: { options: [] } };

jest.mock('@shell/edit/provisioning.cattle.io.cluster/shared', () => ({
  RETENTION_DEFAULT:         5,
  RKE2_INGRESS_NGINX:        'rke2-ingress-nginx',
  RKE2_TRAEFIK:              'rke2-traefik',
  INGRESS_NGINX:             'ingress-nginx',
  INGRESS_CONTROLLER:        'ingress-controller',
  TRAEFIK:                   'traefik',
  HARVESTER:                 'harvester',
  INGRESS_DUAL:              'dual',
  INGRESS_NONE:              'none',
  INGRESS_OPTIONS:           [],
  INGRESS_MIGRATION_KB_LINK: 'mock-link'
}));
const mockRke2Charts = {
  [RKE2_INGRESS_NGINX]: {},
  [RKE2_TRAEFIK]:       {},
  'rke2-cilium':        {}
};
const mockK3sCharts = { 'rke2-cilium': {} };
const rke2Versions = [
  {
    id: 'v1.31.0+rke2r1', value: 'v1.31.0+rke2r1', serverArgs: mockServerArgs, agentArgs: mockAgentArgs, charts: mockRke2Charts
  },
  {
    id: 'v1.30.0+rke2r1', value: 'v1.30.0+rke2r1', serverArgs: mockServerArgs, agentArgs: mockAgentArgs, charts: mockRke2Charts
  },
  {
    id: 'v1.29.1+rke2r1', value: 'v1.29.1+rke2r1', serverArgs: mockServerArgs, agentArgs: mockAgentArgs, charts: mockRke2Charts
  },
  {
    id: 'v1.25.0+rke2r1', value: 'v1.25.0+rke2r1', serverArgs: mockServerArgs, agentArgs: mockAgentArgs, charts: mockRke2Charts
  },
  {
    id: 'v1.24.0+rke2r1', value: 'v1.24.0+rke2r1', serverArgs: mockServerArgs, agentArgs: mockAgentArgs, charts: mockRke2Charts
  },
  {
    id: 'v1.23.0+rke2r1', value: 'v1.23.0+rke2r1', serverArgs: mockServerArgs, agentArgs: mockAgentArgs, charts: mockRke2Charts
  }
];
const k3sVersions = [
  {
    id: 'v1.31.0+k3s1', value: 'v1.31.0+k3s1', serverArgs: mockServerArgs, agentArgs: mockAgentArgs, charts: mockK3sCharts
  },
  {
    id: 'v1.30.0+k3s1', value: 'v1.30.0+k3s1', serverArgs: mockServerArgs, agentArgs: mockAgentArgs, charts: mockK3sCharts
  },
  {
    id: 'v1.29.1+k3s1', value: 'v1.29.1+k3s1', serverArgs: mockServerArgs, agentArgs: mockAgentArgs, charts: mockK3sCharts
  },
  {
    id: 'v1.25.0+k3s1', value: 'v1.25.0+k3s1', serverArgs: mockServerArgs, agentArgs: mockAgentArgs, charts: mockK3sCharts
  },
  {
    id: 'v1.24.0+k3s1', value: 'v1.24.0+k3s1', serverArgs: mockServerArgs, agentArgs: mockAgentArgs, charts: mockK3sCharts
  },
  {
    id: 'v1.23.0+k3s1', value: 'v1.23.0+k3s1', serverArgs: mockServerArgs, agentArgs: mockAgentArgs, charts: mockK3sCharts
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
  }
};

const defaultSpec = {
  rkeConfig:   { etcd: { disableSnapshots: false }, machineGlobalConfig: { cni: 'calico' } },
  chartValues: {},
};

const defaultCiliumSpec = {
  rkeConfig:   { etcd: { disableSnapshots: false }, machineGlobalConfig: { cni: 'cilium' } },
  chartValues: {},
};

// bandwidth manager
const bmOnValue = { bandwidthManager: { enabled: true } };
const bmOffValue = { bandwidthManager: { enabled: false } };

function createBasicsTab(version : string, userChartValues: any, options = {}) {
  const k8s = mockVersionOptions.find((v) => v.id === version) || mockVersionOptions[0];
  const label = 'whatever';
  const providedUserChartValues = userChartValues || {};
  const providedVersionInfo = k8s.charts || {};

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
      userChartValues:             providedUserChartValues,
      versionInfo:                 providedVersionInfo,
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
        addonVersions:               [],
        versionInfo:                 {},
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
        addonVersions:               [],
        versionInfo:                 {},
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
        addonVersions:      [],
        versionInfo:        {},
        cisPsaChangeBanner: true,
        allPsas:            [],
        cisOverride:        override,
        selectedVersion:    mockVersionOptions[0],
        versionOptions:     [{
          value:     k8s,
          agentArgs: { profile: { options: [cis] } },
          charts:    mockRke2Charts,
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

      // Click the checkbox to turn bm off again
      await bmCheckbox.find('label').trigger('click');
      await nextTick();
      await nextTick();

      // Update from the emitted value
      latest = (wrapper.emitted()['cilium-values-changed'] || [])[1][0];

      expect(JSON.stringify(latest)).toStrictEqual(JSON.stringify(bmOffValue));
    });

    it('should supportbandwidth manager', async() => {
      const wrapper = createBasicsTab('v1.25.0+rke2r1', {});
      const bmCheckbox = wrapper.find('[data-testid="cluster-rke2-cni-cilium-bandwidth-manager-checkbox"]');

      // Click the checkbox - should enable bandwidth manager
      await bmCheckbox.find('label').trigger('click');
      await nextTick();
      await nextTick();

      let latest = (wrapper.emitted()['cilium-values-changed'] || [])[0][0];

      await wrapper.setProps({ userChartValues: { 'rke2-cilium': latest } });

      const exp = { bandwidthManager: { enabled: true } };

      expect(JSON.stringify(latest)).toStrictEqual(JSON.stringify(exp));

      // Check that other properties are preserved
      latest = {
        ...latest,
        bandwidthManager: {
          test:    true,
          enabled: false
        },
      };

      await wrapper.setProps({ userChartValues: { 'rke2-cilium': latest } });

      // Click the checkbox to turn bandwidth manager off again
      await bmCheckbox.find('label').trigger('click');
      await nextTick();
      await nextTick();

      latest = (wrapper.emitted()['cilium-values-changed'] || [])[1][0];

      const expected = '{"bandwidthManager":{"test":true,"enabled":true}}';

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
});
