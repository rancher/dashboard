import { mount, shallowMount } from '@vue/test-utils';
import { SECRET } from '@shell/config/types';
import { _CREATE, _EDIT } from '@shell/config/query-params';
import rke2 from '@shell/edit/provisioning.cattle.io.cluster/rke2.vue';
import { get } from '@shell/utils/object';
import { rke2TestTable } from './utils/rke2-test-data';
import {
  RKE2_INGRESS_NGINX, INGRESS_CONTROLLER, INGRESS_NGINX, TRAEFIK, INGRESS_NONE, RKE2_TRAEFIK
} from '@shell/edit/provisioning.cattle.io.cluster/shared';

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

/**
 * DISCLAIMER ***************************************************************************************
 * Declarations should not be done outside the tests!!
 * This component is overwhelming for test and requires too much initialization.
 * In this way the tests are more readable and we can avoid annoying repetitions.
 ****************************************************************************************************
 */
const defaultStubs = {
  CruResource:              { template: '<div><slot></slot></div>' }, // Required to render the slot content
  Banner:                   true,
  LabeledSelect:            true,
  ACE:                      true,
  AgentEnv:                 true,
  AgentConfiguration:       true,
  ArrayList:                true,
  ArrayListGrouped:         true,
  BadgeState:               true,
  Checkbox:                 true,
  ClusterMembershipEditor:  true,
  ClusterAppearance:        true,
  DrainOptions:             true,
  LabeledInput:             true,
  Labels:                   true,
  Loading:                  true,
  MachinePool:              true,
  MatchExpressions:         true,
  NameNsDescription:        true,
  Questions:                true,
  RadioGroup:               true,
  RegistryConfigs:          true,
  RegistryMirrors:          true,
  S3Config:                 true,
  SelectCredential:         true,
  SelectOrCreateAuthSecret: true,
  Tab:                      true,
  Tabbed:                   true,
  UnitInput:                true,
  YamlEditor:               true,
  MemberRoles:              true,
  Basics:                   true,
  Etcd:                     true,
  Networking:               true,
  Upgrade:                  true,
  Registries:               true,
  AddOnConfig:              true,
  Advanced:                 true
};

const mockAgentArgs = { 'cloud-provider-name': { options: [], profile: { options: [{ anything: 'yes' }] } } };

const defaultGetters = {
  currentStore:                      () => 'current_store',
  'management/schemaFor':            jest.fn(),
  'current_store/all':               jest.fn(),
  'i18n/t':                          jest.fn(),
  'i18n/withFallback':               jest.fn(),
  'plugins/cloudProviderForDriver':  jest.fn(),
  'customization/getPreviewCluster': jest.fn(),
};

const defaultMocks = {
  $fetchState: { pending: false },
  $route:      {
    name:  'anything',
    query: { AS: 'yaml' },
  },
};

const defaultSpec = {
  rkeConfig:   { etcd: { disableSnapshots: false } },
  chartValues: {},
};

describe('component: rke2', () => {
  /**
   * DISCLAIMER ***************************************************************************************
   * Logs are prevented to avoid polluting the test output.
   ****************************************************************************************************
  */
  // eslint-disable-next-line jest/no-hooks
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => { });
  });

  it.each([
    ['custom', true],
    ['anything else', false] // without proper data, machine pool is always not present
  ])('should allow creation of RKE2 cluster with provider %p if pool machines are missing (%p)', (provider, result) => {
    const k8s = 'v1.25.0+rke2r1';
    const wrapper = mount(rke2, {
      props: {
        mode:  _CREATE,
        value: {
          spec: {
            ...defaultSpec,
            kubernetesVersion: k8s,

          },
          agentConfig: { 'cloud-provider-name': 'any' }
        },
        selectedVersion: { agentArgs: mockAgentArgs },
        provider,
      },

      global: {
        mocks: {
          ...defaultMocks,
          $store:     { dispatch: () => jest.fn(), getters: defaultGetters },
          $extension: { getDynamic: jest.fn(() => undefined ) }
        },

        stubs: defaultStubs,
      },
    });

    expect((wrapper.vm as any).validationPassed).toBe(result);
  });

  it('should allow creation of K3 clusters if pool machines are missing', () => {
    const k8s = 'v1.25.0+k3s1';
    const wrapper = mount(rke2, {
      props: {
        mode:  _CREATE,
        value: {
          spec: {
            ...defaultSpec,
            kubernetesVersion: k8s
          },
          agentConfig: { 'cloud-provider-name': 'any' }
        },
        provider: 'custom'
      },

      data: () => ({ credentialId: 'I am authenticated' }),

      global: {
        mocks: {
          ...defaultMocks,
          $store:     { dispatch: () => jest.fn(), getters: defaultGetters },
          $extension: { getDynamic: jest.fn(() => undefined ) },
        },

        stubs: defaultStubs,
      },
    });

    expect((wrapper.vm as any).validationPassed).toBe(true);
  });

  it('should initialize machine pools with drain before delete true', async() => {
    const k8s = 'v1.25.0+k3s1';
    const wrapper = mount(rke2, {
      props: {
        mode:  _CREATE,
        value: {
          spec: {
            ...defaultSpec,
            kubernetesVersion: k8s
          },
          agentConfig: { 'cloud-provider-name': 'any' }
        },
        provider: 'custom'
      },

      data: () => ({ credentialId: 'I am authenticated' }),

      global: {
        mocks: {
          ...defaultMocks,
          $store:     { dispatch: () => jest.fn(), getters: defaultGetters },
          $extension: { getDynamic: jest.fn(() => undefined ) },
        },

        stubs: defaultStubs,
      },
    });

    await wrapper.vm.initSpecs();

    wrapper.vm.machinePools.forEach((p: any) => expect(p.drainBeforeDelete).toBe(true));
  });

  it('should set distro root directory from k8sDistro on a Harvester cluster creation on save override (_doSaveOverride)', async() => {
    const k8s = 'v1.25.0+k3s1';

    const HARVESTER = 'harvester';
    const HARVESTER_CLOUD_PROVIDER = 'harvester-cloud-provider';

    const newSpec = Object.assign({}, defaultSpec);

    newSpec.rkeConfig.dataDirectories = { k8sDistro: 'my-k8s-distro-path' };

    const wrapper = mount(rke2, {
      props: {
        mode:  _CREATE,
        value: {
          spec: {
            ...newSpec,
            kubernetesVersion: k8s
          },
          metadata:    { name: 'cluster-name' },
          agentConfig: { 'cloud-provider-name': HARVESTER }
        },
        provider: 'custom'
      },

      data: () => ({
        credentialId: 'I am authenticated',
        credential:   { decodedData: { clusterId: 'some-cluster-id' } },
        machinePools: [],
      }),

      global: {
        mocks: {
          ...defaultMocks,
          $store: {
            // mock secret creation on "createKubeconfigSecret"
            dispatch: (action: any, opts: any) => {
              if (action === 'management/create' && opts.type === SECRET) {
                return { save: () => jest.fn };
              } else {
                return jest.fn();
              }
            },
            getters: defaultGetters
          },
          $extension: { getDynamic: jest.fn(() => undefined ) },
        },

        stubs: defaultStubs,
      },
    });

    // we need to mock the "save" method from the create-edit-view-mixin
    // otherwise we get console errors
    // jest.spyOn(wrapper.vm, 'save').mockImplementation();

    await wrapper.vm._doSaveOverride(jest.fn());
    const chartKey = wrapper.vm.chartVersionKey(HARVESTER_CLOUD_PROVIDER);

    const cloudConfigPath = get(wrapper.vm.userChartValues, `${ chartKey }.cloudConfigPath`);

    expect(cloudConfigPath).toStrictEqual('my-k8s-distro-path/etc/config-files/cloud-provider-config');
  });

  // TODO: Complete test after implementing fetch https://github.com/rancher/dashboard/issues/9322
  // eslint-disable-next-line jest/no-disabled-tests
  describe.skip('should initialize agent configuration values', () => {
    it('adding default values if none', async() => {
      const wrapper = shallowMount(rke2, {
        props: {
          mode:  'create',
          value: {
            spec:        { ...defaultSpec },
            agentConfig: { 'cloud-provider-name': 'any' }
          },
          provider: 'custom'
        },

        global: {
          mocks: {
            ...defaultMocks,
            $store: {
              getters:  defaultGetters,
              dispatch: {
                'management/request': jest.fn(),
                'management/find':    jest.fn(),
                'management/findAll': () => ([]),
              }
            },
            $extension: { getDynamic: jest.fn(() => undefined ) },
          },

          stubs: defaultStubs,
        },
      });
      const defaultAgentConfig = {
        clusterAgentDeploymentCustomization: {
          overrideAffinity:             {},
          appendTolerations:            [],
          overrideResourceRequirements: {}
        },
        fleetAgentDeploymentCustomization: {
          overrideAffinity:             {},
          appendTolerations:            [],
          overrideResourceRequirements: {}
        }
      };

      // Setting RKE to avoid calls
      wrapper.setData({ rke2Versions: [] });

      // await rke2.fetch.call(wrapper.vm);

      expect(wrapper.props().value.spec).toContain(defaultAgentConfig);
    });

    it('should display agent configuration tab', async() => {
      const wrapper = shallowMount(rke2, {
        props: {
          mode:  'create',
          value: {
            spec:        { ...defaultSpec },
            agentConfig: { 'cloud-provider-name': 'any' }
          },
          provider: 'custom'
        },

        global: {
          mocks: {
            ...defaultMocks,
            $store: {
              getters:  defaultGetters,
              dispatch: {
                'management/request': jest.fn(),
                'management/find':    jest.fn(),
                'management/findAll': () => ([]),
              }
            },
            $extension: { getDynamic: jest.fn(() => undefined ) },
          },

          stubs: defaultStubs,
        },
      });
      const agent = wrapper.find('[data-testid="rke2-cluster-agent-config"]');

      // Setting RKE to avoid calls
      wrapper.setData({ rke2Versions: [] });

      await rke2.fetch.call(wrapper.vm);

      expect(agent.element).toBeDefined();
    });
  });

  it.each([
    ['v1.25.0+k3s1', [{ value: 'aws' }, { value: 'azure' }], 'azure', true],
    ['v1.31.0+k3s1', [{ value: 'aws' }, { value: 'azure' }], 'harvester', true],
    ['v1.29.0+k3s1', [{ value: 'aws' }, { value: 'azure' }], 'harvester', false],
    ['v1.31.0+k3s1', [{ value: 'aws' }], 'azure', false],
  ])('should set isAzureProviderUnsupported', (k8s, providerOptions, cloudProvider, value) => {
    const wrapper = mount(rke2, {
      propsData: {
        mode:  _CREATE,
        value: {
          spec: {
            ...defaultSpec,
            kubernetesVersion: k8s
          },
          agentConfig: { 'cloud-provider-name': cloudProvider }
        },
        provider: 'custom'
      },
      data:     () => ({}),
      computed: {
        ...rke2.computed,
        cloudProviderOptions() {
          return providerOptions;
        },
      },
      global: {
        mocks: {
          ...defaultMocks,
          $store:     { dispatch: () => jest.fn(), getters: defaultGetters },
          $extension: { getDynamic: jest.fn(() => undefined ) },
        },
        stubs: defaultStubs
      }
    });

    expect(wrapper.vm.isAzureProviderUnsupported).toBe(value);
  });

  it.each([
    ['edit', 'v1.31.0+k3s1', 'azure', false],
    ['edit', 'v1.26.0+k3s1', 'azure', false],
    ['edit', 'v1.28.0+k3s1', 'harvester', false],
    ['edit', 'v1.28.0+k3s1', 'azure', true],
    ['create', 'v1.28.0+k3s1', 'azure', false],
    ['view', 'v1.28.0+k3s1', 'azure', false],
  ])('should set canAzureMigrateOnEdit', (mode, k8s, liveCloudProvider, value) => {
    const wrapper = mount(rke2, {
      propsData: {
        mode,
        liveValue: {
          spec: {
            ...defaultSpec,
            kubernetesVersion: k8s
          },
          agentConfig: { 'cloud-provider-name': liveCloudProvider }
        },
        value: {
          spec: {
            ...defaultSpec,
            kubernetesVersion: k8s
          },
          agentConfig: { 'cloud-provider-name': liveCloudProvider }
        },
        provider: 'custom'
      },
      global: {
        mocks: {
          ...defaultMocks,
          $store:     { dispatch: () => jest.fn(), getters: defaultGetters },
          $extension: { getDynamic: jest.fn(() => undefined ) },
        },
        stubs: defaultStubs
      }
    });

    expect((wrapper.vm as any).canAzureMigrateOnEdit).toBe(value);
  });

  it.each([
    ['', 'v1.32.0+rke2r1', 'amazon', 'v1.32.0+rke2r1'],
    ['', 'v1.29.0+rke2r1', 'amazon', 'v1.29.0+rke2r1'],
    ['', 'v1.29.0+rke2r1', 'azure', 'v1.29.0+rke2r1'],
    ['not', 'v1.31.0+rke2r1', 'azure', undefined],
  ])('should %p include version %p if Cloud Provider is %p', async(_, k8s, liveCloudProvider, value) => {
    const wrapper = mount(rke2, {
      propsData: {
        mode:  'create',
        value: {
          spec: {
            ...defaultSpec,
            kubernetesVersion: k8s
          },
          agentConfig: { 'cloud-provider-name': liveCloudProvider }
        },
        provider: 'custom'
      },
      data:   () => ({}),
      global: {
        mocks: {
          ...defaultMocks,
          $store:     { dispatch: () => jest.fn(), getters: defaultGetters },
          $extension: { getDynamic: jest.fn(() => undefined ) },
        },
        stubs: defaultStubs
      }
    });

    wrapper.setData({
      rke2Versions: [{
        id:         k8s,
        version:    k8s,
        serverArgs: true,
        charts:     {
          [RKE2_INGRESS_NGINX]: {},
          [RKE2_TRAEFIK]:       {}
        }
      }]
    });

    expect((wrapper.vm as any).versionOptions[0]?.value).toBe(value);
  });

  it.each([
    ['enable', 'v1.28.0+rke2r1', false],
    ['disable', 'v1.32.0+rke2r1', true],
  ])('should %p Azure provider option if version is %p', async(_, k8s, value) => {
    const wrapper = mount(rke2, {
      propsData: {
        mode:  'create',
        value: {
          spec: {
            ...defaultSpec,
            kubernetesVersion: k8s
          },
          agentConfig: { 'cloud-provider-name': 'azure' }
        },
        provider: 'custom'
      },
      computed: {
        ...rke2.computed,
        agentArgs: () => ({
          'cloud-provider-name': {
            options: [
              'azure',
              'amazon'
            ]
          }
        })
      },
      global: {
        mocks: {
          ...defaultMocks,
          $store:     { dispatch: () => jest.fn(), getters: defaultGetters },
          $extension: { getDynamic: jest.fn(() => undefined ) },
        },
        stubs: defaultStubs
      }
    });

    const azureOption = (wrapper.vm as any).cloudProviderOptions.find((o: any) => o.value === 'azure');

    expect(azureOption.disabled).toBe(value);
  });

  it.each([
    ['enable', 'azure', 'v1.28.0+rke2r1', false], // azure provider / current
    ['enable', 'external', 'v1.28.0+rke2r1', false], // external provider
    ['enable', 'azure', 'v1.26.0+rke2r1', false], // version mismatch
    ['disable', 'amazon', 'v1.26.0+rke2r1', true],
    ['enable', '', 'v1.28.0+rke2r1', true], // default provider
  ])('should %p provider option %p in edit mode if live provider is Azure and 1.27 <= k8s < 1.30', async(_, cloudProvider, k8s, value) => {
    const wrapper = mount(rke2, {
      propsData: {
        mode:  'edit',
        value: {
          spec: {
            ...defaultSpec,
            kubernetesVersion: k8s
          },
          agentConfig: { 'cloud-provider-name': 'azure' }
        },
        provider: 'custom'
      },
      computed: {
        ...rke2.computed,
        canAzureMigrateOnEdit: () => true,
        agentArgs:             () => ({
          'cloud-provider-name': {
            options: [
              'azure',
              'amazon',
              'external'
            ]
          }
        })
      },
      global: {
        mocks: {
          ...defaultMocks,
          $store:     { dispatch: () => jest.fn(), getters: defaultGetters },
          $extension: { getDynamic: jest.fn(() => undefined ) },
        },
        stubs: defaultStubs
      }
    });

    const azureOption = (wrapper.vm as any).cloudProviderOptions.find((o: any) => o.value === cloudProvider);

    expect(azureOption.disabled).toBe(value);
  });

  it.each(rke2TestTable)('should preserve valid user-supplied chart values', (chartValues, expected) => {
    const wrapper = mount(rke2, {
      props: {
        mode:  _CREATE,
        value: {
          spec: {
            ...defaultSpec,
            chartValues,
            kubernetesVersion: 'v1.32.3+rke2r1',
            rkeConfig:         {
              machineGlobalConfig: {
                cni:                   'calico',
                'disable-kube-proxy':  false,
                'etcd-expose-metrics': false
              },
            }
          },
          agentConfig: { 'cloud-provider-name': 'any' }
        },
        provider: 'custom'
      },
      data: () => ({
        credentialId:    'I am authenticated',
        userChartValues: chartValues,
        rke2Versions:    [
          {
            id:                      'v1.32.3+rke2r1',
            type:                    'release',
            links:                   { self: 'https://127.0.0.1:8005/v1-rke2-release/releases/v1.32.3+rke2r1' },
            version:                 'v1.32.3+rke2r1',
            minChannelServerVersion: 'v2.11.0-alpha1',
            maxChannelServerVersion: 'v2.11.99',
            serverArgs:              {},
            agentArgs:               {},
            featureVersions:         { 'encryption-key-rotation': '2.0.0' },
            charts:                  {
              'rke2-ingress-nginx': {
                repo:    'rancher-rke2-charts',
                version: '4.12.100'
              },
              'rke2-metrics-server': {
                repo:    'rancher-rke2-charts',
                version: '3.12.200'
              },
              'rke2-traefik': {}
            }
          }
        ]
      }),

      global: {
        mocks: {
          ...defaultMocks,
          $store:     { dispatch: () => jest.fn(), getters: defaultGetters },
          $extension: { getDynamic: jest.fn(() => undefined ) },
        },

        stubs: defaultStubs,
      },
    });

    wrapper.vm.applyChartValues(wrapper.vm.value.spec.rkeConfig);

    expect(wrapper.vm.value.spec.rkeConfig.chartValues).toStrictEqual(expected);
  });

  describe('should correctly update NGINX configuration', () => {
    const k8sVersion = 'v1.25.0+rke2r1';
    const createWrapper = (mode = _EDIT) => {
      return shallowMount(rke2, {
        props: {
          mode,
          value: {
            spec: {
              ...defaultSpec,
              rkeConfig: {
                machineGlobalConfig:   {},
                chartValues:           {},
                upgradeStrategy:       {},
                dataDirectories:       {},
                machineSelectorConfig: []
              },
              kubernetesVersion: k8sVersion,
            },
            agentConfig: {}
          },
          provider: 'custom',
        },
        global: {
          mocks: {
            ...defaultMocks,
            $store:     { dispatch: () => jest.fn(), getters: defaultGetters },
            $extension: { getDynamic: jest.fn(() => undefined ) },
          },
          stubs: defaultStubs,
        },
      });
    };
    const mockCharts = {
      [RKE2_INGRESS_NGINX]: {},
      [RKE2_TRAEFIK]:       {}
    };

    it('should set ingress-controller to traefik by default for new clusters', async() => {
      const wrapper = createWrapper(_CREATE);

      await wrapper.setData({
        rke2Versions: [{
          id:         k8sVersion,
          version:    k8sVersion,
          serverArgs: { disable: { options: [RKE2_INGRESS_NGINX] } },
          charts:     mockCharts
        }]
      });

      expect(wrapper.vm.value.spec.rkeConfig.machineGlobalConfig[INGRESS_CONTROLLER]).toBe(TRAEFIK);
    });

    it('should set ingress-controller to None on version change when nginx is not supported', async() => {
      const wrapper = createWrapper();
      const newVersion = 'v1.26.0+rke2r1';

      await wrapper.setData({
        rke2Versions: [{
          id:         k8sVersion,
          version:    k8sVersion,
          serverArgs: { disable: { options: [] } },
          charts:     mockCharts
        },
        {
          id:         newVersion,
          version:    newVersion,
          serverArgs: { disable: { options: [] } },
          charts:     mockCharts
        }]
      });
      wrapper.vm.value.spec.kubernetesVersion = newVersion;
      (wrapper.vm as any).handleKubernetesChange(newVersion);
      expect(wrapper.vm.value.spec.rkeConfig.machineGlobalConfig[INGRESS_CONTROLLER]).toBe(INGRESS_NONE);
    });

    it('should set ingress-controller to ingress-nginx on change when nginx is supported and not disabled', () => {
      const wrapper = createWrapper();

      wrapper.setData({
        rke2Versions: [{
          id:         k8sVersion,
          version:    k8sVersion,
          serverArgs: { disable: { options: [RKE2_INGRESS_NGINX] } },
          charts:     mockCharts
        }]
      });

      (wrapper.vm as any).handleEnabledSystemServicesChanged([]);

      expect(wrapper.vm.value.spec.rkeConfig.machineGlobalConfig[INGRESS_CONTROLLER]).toBe(INGRESS_NGINX);
    });

    it('should set ingress-controller to None when nginx is supported but disabled', () => {
      const wrapper = createWrapper();

      wrapper.setData({
        rke2Versions: [{
          id:         k8sVersion,
          version:    k8sVersion,
          serverArgs: { disable: { options: [RKE2_INGRESS_NGINX] } },
          charts:     mockCharts
        }]
      });

      (wrapper.vm as any).handleEnabledSystemServicesChanged([RKE2_INGRESS_NGINX]);

      expect(wrapper.vm.value.spec.rkeConfig.machineGlobalConfig[INGRESS_CONTROLLER]).toBe(INGRESS_NONE);
    });

    it('should set ingress-controller for existing cluster to None when nginx is not supported', () => {
      const wrapper = createWrapper();

      wrapper.setData({
        rke2Versions: [{
          id:         k8sVersion,
          version:    k8sVersion,
          serverArgs: { disable: { options: [] } },
          charts:     mockCharts
        }]
      });

      (wrapper.vm as any).handleEnabledSystemServicesChanged([]);

      expect(wrapper.vm.value.spec.rkeConfig.machineGlobalConfig[INGRESS_CONTROLLER]).toBe(INGRESS_NONE);
    });

    it('should correctly update disable list in serverConfig', () => {
      const wrapper = createWrapper();

      wrapper.setData({
        rke2Versions: [{
          id:         k8sVersion,
          version:    k8sVersion,
          serverArgs: { disable: { options: [RKE2_INGRESS_NGINX] } },
          charts:     mockCharts
        }]
      });
      const disabledServices = ['other-service'];

      (wrapper.vm as any).handleEnabledSystemServicesChanged(disabledServices);

      expect(wrapper.vm.value.spec.rkeConfig.machineGlobalConfig.disable).toStrictEqual(disabledServices);
    });

    it('should set ingress-controller to ingress-nginx on version change when nginx is supported', async() => {
      const wrapper = createWrapper();
      const newVersion = 'v1.26.0+rke2r1';

      await wrapper.setData({
        rke2Versions: [
          {
            id:         k8sVersion,
            version:    k8sVersion,
            serverArgs: { disable: { options: [RKE2_INGRESS_NGINX] } },
            charts:     mockCharts
          },
          {
            id:         newVersion,
            version:    newVersion,
            serverArgs: { disable: { options: [RKE2_INGRESS_NGINX] } },
            charts:     mockCharts
          }
        ]
      });

      wrapper.vm.value.spec.kubernetesVersion = newVersion;
      (wrapper.vm as any).handleKubernetesChange(newVersion);

      expect(wrapper.vm.value.spec.rkeConfig.machineGlobalConfig[INGRESS_CONTROLLER]).toBe(INGRESS_NGINX);
    });
  });

  describe('method: showIpv6Warning', () => {
    const createWrapper = ({ mode = _CREATE, dispatch = jest.fn() } = {}) => {
      return shallowMount(rke2, {
        props: {
          mode,
          value: {
            spec: {
              ...defaultSpec,
              rkeConfig: {
                ...defaultSpec.rkeConfig,
                networking: { stackPreference: 'ipv6' }
              }
            },
            agentConfig: { 'cloud-provider-name': 'any' }
          },
          provider: 'custom'
        },
        global: {
          mocks: {
            ...defaultMocks,
            $store:     { dispatch, getters: defaultGetters },
            $extension: { getDynamic: jest.fn(() => undefined ) },
          },
          stubs: defaultStubs,
        },
      });
    };

    it('should not show modal when mode is not create', async() => {
      const dispatch = jest.fn();
      const wrapper = createWrapper({ mode: _EDIT, dispatch });

      await wrapper.setData({ machinePools: [{ id: 'pool1' }] });

      await (wrapper.vm as any).showIpv6Warning();

      expect(dispatch).toHaveBeenCalledTimes(0);
    });

    it('should not show modal when networking values are valid', async() => {
      const dispatch = jest.fn();
      const wrapper = createWrapper({ dispatch });

      await wrapper.setData({ machinePools: [{ id: 'pool1' }] });

      Object.defineProperty(wrapper.vm, 'selectedVersion', { get: () => ({ label: 'v1.30.0+rke2r1' }) });
      Object.defineProperty(wrapper.vm, 'hasOnlyIpv6Pools', { get: () => true });
      Object.defineProperty(wrapper.vm, 'hasDualStackPools', { get: () => false });

      wrapper.vm.value.spec.rkeConfig.networking.stackPreference = 'ipv6';
      wrapper.vm.value.spec.rkeConfig.machineGlobalConfig['flannel-ipv6-masq'] = true;
      wrapper.vm.value.spec.rkeConfig.machineGlobalConfig['cluster-cidr'] = '2001:db8::/64';
      wrapper.vm.value.spec.rkeConfig.machineGlobalConfig['service-cidr'] = '2001:db8:1::/112';

      await (wrapper.vm as any).showIpv6Warning();

      expect(dispatch).toHaveBeenCalledTimes(0);
    });

    it('should show modal with all relevant warnings for invalid ipv6 settings', async() => {
      const dispatch = jest.fn((_action, payload) => {
        payload.componentProps.confirm(true);
      });
      const wrapper = createWrapper({ dispatch });

      await wrapper.setData({ machinePools: [{ id: 'pool1' }] });

      Object.defineProperty(wrapper.vm, 'selectedVersion', { get: () => ({ label: 'v1.30.0+k3s1' }) });
      Object.defineProperty(wrapper.vm, 'hasOnlyIpv6Pools', { get: () => true });
      Object.defineProperty(wrapper.vm, 'hasDualStackPools', { get: () => false });

      wrapper.vm.value.spec.rkeConfig.networking.stackPreference = 'ipv4';
      wrapper.vm.value.spec.rkeConfig.machineGlobalConfig['flannel-ipv6-masq'] = false;
      wrapper.vm.value.spec.rkeConfig.machineGlobalConfig['cluster-cidr'] = '10.42.0.0/16';
      wrapper.vm.value.spec.rkeConfig.machineGlobalConfig['service-cidr'] = '10.43.0.0/16';

      await (wrapper.vm as any).showIpv6Warning();

      expect(dispatch).toHaveBeenCalledWith('cluster/promptModal', expect.objectContaining({
        component:      'Ipv6NetworkingDialog',
        componentProps: expect.objectContaining({
          isK3s:    true,
          warnings: [
            'cluster.rke2.modal.ipv6Warning.stackPrefInvalid',
            'cluster.rke2.modal.ipv6Warning.flannelMasqInvalid',
            'cluster.rke2.modal.ipv6Warning.cidrInvalidK3s'
          ]
        })
      }));
    });

    it('should reject when user cancels ipv6 warning modal', async() => {
      const dispatch = jest.fn((_action, payload) => {
        payload.componentProps.confirm(false);
      });
      const wrapper = createWrapper({ dispatch });

      await wrapper.setData({ machinePools: [{ id: 'pool1' }] });

      Object.defineProperty(wrapper.vm, 'hasOnlyIpv6Pools', { get: () => true });
      Object.defineProperty(wrapper.vm, 'hasDualStackPools', { get: () => false });

      wrapper.vm.value.spec.rkeConfig.networking.stackPreference = 'ipv4';
      wrapper.vm.value.spec.rkeConfig.machineGlobalConfig['cluster-cidr'] = '10.42.0.0/16';
      wrapper.vm.value.spec.rkeConfig.machineGlobalConfig['service-cidr'] = '10.43.0.0/16';

      await expect((wrapper.vm as any).showIpv6Warning()).rejects.toThrow('User Cancelled');
      expect(dispatch).toHaveBeenCalledWith('cluster/promptModal', expect.any(Object));
    });
  });

  describe('computed: canEditAsYaml', () => {
    it('should return false when isUpstreamCAPIProvider is true', () => {
      const vm = { isUpstreamCAPIProvider: true } as any;

      const canEditAsYaml = rke2.computed!.canEditAsYaml.call(vm);

      expect(canEditAsYaml).toBe(false);
    });

    it('should return true when isUpstreamCAPIProvider is false', () => {
      const vm = { isUpstreamCAPIProvider: false } as any;

      const canEditAsYaml = rke2.computed!.canEditAsYaml.call(vm);

      expect(canEditAsYaml).toBe(true);
    });
  });

  describe('extensionProvider.onEvent error handling', () => {
    const makeVm = (onEvent: jest.Mock) => {
      const vm: Record<string, any> = {
        extensionProvider:        { onEvent },
        errors:                   [] as unknown[],
        infrastructureCluster:    null,
        value:                    { spec: {} },
        togglePsaDefault:         jest.fn(),
        updateNginxConfiguration: jest.fn(),
        isHarvesterDriver:        false,
        serverConfig:             {},
      };

      // Bind the real _scheduleOnEvent so handleKubernetesChange can call it
      vm._scheduleOnEvent = (fn: () => unknown) => (rke2.methods as any)._scheduleOnEvent.call(vm, fn);

      return vm;
    };

    const flushPromises = () => new Promise(process.nextTick);

    describe('method: handleKubernetesChange', () => {
      it('pushes error to this.errors when onEvent rejects', async() => {
        const err = new Error('prepareProvCluster failed');
        const onEvent = jest.fn().mockImplementation(() => Promise.reject(err));
        const vm = makeVm(onEvent) as any;

        (rke2.methods as any).handleKubernetesChange.call(vm, 'v1.30.0+rke2r1', 'v1.29.0+rke2r1');
        await flushPromises();

        expect(vm.errors).toContain(err);
      });

      it('does not push to this.errors when onEvent resolves', async() => {
        const onEvent = jest.fn().mockImplementation(() => Promise.resolve());
        const vm = makeVm(onEvent) as any;

        (rke2.methods as any).handleKubernetesChange.call(vm, 'v1.30.0+rke2r1', 'v1.29.0+rke2r1');
        await flushPromises();

        expect(vm.errors).toHaveLength(0);
      });

      it('does not push to this.errors when onEvent is synchronous', async() => {
        const onEvent = jest.fn().mockReturnValue(undefined);
        const vm = makeVm(onEvent) as any;

        (rke2.methods as any).handleKubernetesChange.call(vm, 'v1.30.0+rke2r1', 'v1.29.0+rke2r1');
        await flushPromises();

        expect(vm.errors).toHaveLength(0);
      });

      it('serializes rapid calls: runs first, then only the latest pending', async() => {
        let resolveFirst!: () => void;
        const firstSettled = new Promise<void>((res) => {
          resolveFirst = res;
        });

        const onEvent = jest.fn()
          .mockImplementationOnce(() => new Promise<void>((res) => {
            firstSettled.then(res);
          }))
          .mockImplementation(() => Promise.resolve());

        const vm = makeVm(onEvent) as any;
        const call = (v: string) => (rke2.methods as any).handleKubernetesChange.call(vm, v, '');

        // Fire three rapid changes while the first is still in-flight
        call('v1.28.0+rke2r1');
        call('v1.29.0+rke2r1'); // replaced by the next
        call('v1.30.0+rke2r1'); // becomes the single pending call

        // First in-flight is running; onEvent called once so far
        expect(onEvent).toHaveBeenCalledTimes(1);

        // Settle the first call — the latest pending (v1.30) should now run
        resolveFirst();
        await flushPromises();

        // Intermediate call (v1.29) was dropped; only v1.28 and v1.30 ran
        expect(onEvent).toHaveBeenCalledTimes(2);
        expect(onEvent).not.toHaveBeenCalledWith(
          'kubernetesVersionChange',
          expect.objectContaining({ newVersion: 'v1.29.0+rke2r1' }),
          expect.anything()
        );
      });
    });

    describe('watcher: credentialId', () => {
      const credentialIdWatcher = (rke2.watch as any).credentialId as (val: string) => void;

      it('pushes error to this.errors when onEvent rejects on credential change', async() => {
        const err = new Error('credential onEvent failed');
        const onEvent = jest.fn().mockImplementation(() => Promise.reject(err));
        const vm = {
          ...makeVm(onEvent),
          $store: { getters: { 'rancher/byId': jest.fn() } },
        } as any;

        credentialIdWatcher.call(vm, 'cred-123');
        await flushPromises();

        expect(vm.errors).toContain(err);
      });

      it('does not push to this.errors when onEvent resolves on credential change', async() => {
        const onEvent = jest.fn().mockImplementation(() => Promise.resolve());
        const vm = {
          ...makeVm(onEvent),
          $store: { getters: { 'rancher/byId': jest.fn() } },
        } as any;

        credentialIdWatcher.call(vm, 'cred-123');
        await flushPromises();

        expect(vm.errors).toHaveLength(0);
      });

      it('does not push to this.errors when onEvent is synchronous on credential change', async() => {
        const onEvent = jest.fn().mockReturnValue(undefined);
        const vm = {
          ...makeVm(onEvent),
          $store: { getters: { 'rancher/byId': jest.fn() } },
        } as any;

        credentialIdWatcher.call(vm, 'cred-123');
        await flushPromises();

        expect(vm.errors).toHaveLength(0);
      });
    });
  });
});
