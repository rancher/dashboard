import { mount, shallowMount } from '@vue/test-utils';
import { SECRET } from '@shell/config/types';
import { _CREATE } from '@shell/config/query-params';
import rke2 from '@shell/edit/provisioning.cattle.io.cluster/rke2.vue';
import { get } from '@shell/utils/object';
import { rke2TestTable } from './utils/rke2-test-data';

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
          $store:  { dispatch: () => jest.fn(), getters: defaultGetters },
          $plugin: { getDynamic: jest.fn(() => undefined ) }
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
          $store:  { dispatch: () => jest.fn(), getters: defaultGetters },
          $plugin: { getDynamic: jest.fn(() => undefined ) },
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
          $store:  { dispatch: () => jest.fn(), getters: defaultGetters },
          $plugin: { getDynamic: jest.fn(() => undefined ) },
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
          $plugin: { getDynamic: jest.fn(() => undefined ) },
        },

        stubs: defaultStubs,
      },
    });

    // we need to mock the "save" method from the create-edit-view-mixin
    // otherwise we get console errors
    jest.spyOn(wrapper.vm, 'save').mockImplementation();

    await wrapper.vm._doSaveOverride(jest.fn());

    const cloudConfigPath = get(wrapper.vm.chartValues, `${ HARVESTER_CLOUD_PROVIDER }.cloudConfigPath`);

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
            $plugin: { getDynamic: jest.fn(() => undefined ) },
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
            $plugin: { getDynamic: jest.fn(() => undefined ) },
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
          $store:  { dispatch: () => jest.fn(), getters: defaultGetters },
          $plugin: { getDynamic: jest.fn(() => undefined ) },
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
          $store:  { dispatch: () => jest.fn(), getters: defaultGetters },
          $plugin: { getDynamic: jest.fn(() => undefined ) },
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
          $store:  { dispatch: () => jest.fn(), getters: defaultGetters },
          $plugin: { getDynamic: jest.fn(() => undefined ) },
        },
        stubs: defaultStubs
      }
    });

    wrapper.setData({
      rke2Versions: [{
        id:         k8s,
        version:    k8s,
        serverArgs: true
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
      data: () => ({
        agentArgs: {
          'cloud-provider-name': {
            options: [
              'azure',
              'amazon'
            ]
          }
        }
      }),
      global: {
        mocks: {
          ...defaultMocks,
          $store:  { dispatch: () => jest.fn(), getters: defaultGetters },
          $plugin: { getDynamic: jest.fn(() => undefined ) },
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
      data: () => ({
        canAzureMigrateOnEdit: true,
        agentArgs:             {
          'cloud-provider-name': {
            options: [
              'azure',
              'amazon',
              'external'
            ]
          }
        }
      }),
      global: {
        mocks: {
          ...defaultMocks,
          $store:  { dispatch: () => jest.fn(), getters: defaultGetters },
          $plugin: { getDynamic: jest.fn(() => undefined ) },
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
            }
          }
        ]
      }),

      global: {
        mocks: {
          ...defaultMocks,
          $store:  { dispatch: () => jest.fn(), getters: defaultGetters },
          $plugin: { getDynamic: jest.fn(() => undefined ) },
        },

        stubs: defaultStubs,
      },
    });

    wrapper.vm.applyChartValues(wrapper.vm.value.spec.rkeConfig);

    expect(wrapper.vm.value.spec.rkeConfig.chartValues).toStrictEqual(expected);
  });
});
