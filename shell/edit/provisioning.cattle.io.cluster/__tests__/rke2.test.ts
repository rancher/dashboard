import { mount, shallowMount, VueWrapper } from '@vue/test-utils';
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

const defaultSpec: {
  rkeConfig: { etcd: { disableSnapshots: boolean }, dataDirectories?: { k8sDistro: string } },
  chartValues: Record<string, any>,
} = {
  rkeConfig:   { etcd: { disableSnapshots: false } },
  chartValues: {},
};

// rke2.vue is a plain-JS SFC. The members below are its own, but vue-tsc resolves them
// to `never` on the instance type, so they are reached through a typed view.
type Rke2Vm = {
  initSpecs: () => Promise<void>,
  _doSaveOverride: (done: () => void) => Promise<void>,
  chartVersionKey: (chart: string) => string,
  applyChartValues: (rkeConfig: Record<string, any>) => void,
  machinePools: { drainBeforeDelete: boolean }[],
};

const rke2Vm = (wrapper: VueWrapper<any>) => wrapper.vm as Rke2Vm;

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

    const rkeVm = rke2Vm(wrapper);

    await rkeVm.initSpecs();

    rkeVm.machinePools.forEach((p) => expect(p.drainBeforeDelete).toBe(true));
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

      data: (() => ({
        credentialId: 'I am authenticated',
        credential:   { decodedData: { clusterId: 'some-cluster-id' } },
        machinePools: [],
      })) as any,

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

    const rkeVm = rke2Vm(wrapper);

    await rkeVm._doSaveOverride(jest.fn());
    const chartKey = rkeVm.chartVersionKey(HARVESTER_CLOUD_PROVIDER);

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

  it('should filter out the azure cloud provider option', () => {
    const wrapper = mount(rke2, {
      props: {
        mode:  _CREATE,
        value: {
          spec: {
            ...defaultSpec,
            kubernetesVersion: 'v1.28.0+rke2r1'
          },
          agentConfig: { 'cloud-provider-name': 'amazon' }
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

    const options = (wrapper.vm as any).cloudProviderOptions;

    expect(options.find((o: any) => o.value === 'azure')).toBeUndefined();
    expect(options.find((o: any) => o.value === 'amazon')).toBeDefined();
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
      data: (() => ({
        credentialId:    'I am authenticated',
        userChartValues: chartValues,
      })) as any,

      global: {
        mocks: {
          ...defaultMocks,
          $store:     { dispatch: () => jest.fn(), getters: defaultGetters },
          $extension: { getDynamic: jest.fn(() => undefined ) },
        },

        stubs: defaultStubs,
      },
    });

    // rke2Versions is owned by the useKubernetesVersions composable (exposed via setup()), not
    // component data - the `data` mount option / wrapper.setData() only reach `$data`, so it has
    // to be seeded directly through the instance proxy instead.
    (wrapper.vm as any).rke2Versions = [
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
    ];

    rke2Vm(wrapper).applyChartValues(wrapper.vm.value.spec.rkeConfig);

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

      (wrapper.vm as any).rke2Versions = [{
        id:         k8sVersion,
        version:    k8sVersion,
        serverArgs: { disable: { options: [RKE2_INGRESS_NGINX] } },
        charts:     mockCharts
      }];

      // The traefik default is set by the `selectedVersion` watcher (via initServerAgentArgs), which
      // Vue flushes on the next tick rather than synchronously.
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.value.spec.rkeConfig.machineGlobalConfig[INGRESS_CONTROLLER]).toBe(TRAEFIK);
    });

    it('should set ingress-controller to None on version change when nginx is not supported', async() => {
      const wrapper = createWrapper();
      const newVersion = 'v1.26.0+rke2r1';

      (wrapper.vm as any).rke2Versions = [{
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
      }];
      wrapper.vm.value.spec.kubernetesVersion = newVersion;
      (wrapper.vm as any).handleKubernetesChange(newVersion);
      expect(wrapper.vm.value.spec.rkeConfig.machineGlobalConfig[INGRESS_CONTROLLER]).toBe(INGRESS_NONE);
    });

    it('should set ingress-controller to ingress-nginx on change when nginx is supported and not disabled', () => {
      const wrapper = createWrapper();

      (wrapper.vm as any).rke2Versions = [{
        id:         k8sVersion,
        version:    k8sVersion,
        serverArgs: { disable: { options: [RKE2_INGRESS_NGINX] } },
        charts:     mockCharts
      }];

      (wrapper.vm as any).handleEnabledSystemServicesChanged([]);

      expect(wrapper.vm.value.spec.rkeConfig.machineGlobalConfig[INGRESS_CONTROLLER]).toBe(INGRESS_NGINX);
    });

    it('should set ingress-controller to None when nginx is supported but disabled', () => {
      const wrapper = createWrapper();

      (wrapper.vm as any).rke2Versions = [{
        id:         k8sVersion,
        version:    k8sVersion,
        serverArgs: { disable: { options: [RKE2_INGRESS_NGINX] } },
        charts:     mockCharts
      }];

      (wrapper.vm as any).handleEnabledSystemServicesChanged([RKE2_INGRESS_NGINX]);

      expect(wrapper.vm.value.spec.rkeConfig.machineGlobalConfig[INGRESS_CONTROLLER]).toBe(INGRESS_NONE);
    });

    it('should set ingress-controller for existing cluster to None when nginx is not supported', () => {
      const wrapper = createWrapper();

      (wrapper.vm as any).rke2Versions = [{
        id:         k8sVersion,
        version:    k8sVersion,
        serverArgs: { disable: { options: [] } },
        charts:     mockCharts
      }];

      (wrapper.vm as any).handleEnabledSystemServicesChanged([]);

      expect(wrapper.vm.value.spec.rkeConfig.machineGlobalConfig[INGRESS_CONTROLLER]).toBe(INGRESS_NONE);
    });

    it('should correctly update disable list in serverConfig', () => {
      const wrapper = createWrapper();

      (wrapper.vm as any).rke2Versions = [{
        id:         k8sVersion,
        version:    k8sVersion,
        serverArgs: { disable: { options: [RKE2_INGRESS_NGINX] } },
        charts:     mockCharts
      }];
      const disabledServices = ['other-service'];

      (wrapper.vm as any).handleEnabledSystemServicesChanged(disabledServices);

      expect(wrapper.vm.value.spec.rkeConfig.machineGlobalConfig.disable).toStrictEqual(disabledServices);
    });

    it('should set ingress-controller to ingress-nginx on version change when nginx is supported', async() => {
      const wrapper = createWrapper();
      const newVersion = 'v1.26.0+rke2r1';

      (wrapper.vm as any).rke2Versions = [
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
      ];

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
  describe('computed: validationPassed (extension provisioning section)', () => {
    const baseVm = {
      hasMachinePools:            false,
      provider:                   'custom',
      machinePoolValidation:      {},
      addonConfigValidation:      {},
      isUpstreamCAPIProvider:     true,
      infrastructureClusterValid: true,
      provisioningClusterValid:   true,
      stackPreferenceError:       false,
    };

    it('should return true when provisioningClusterValid is true', () => {
      const vm = { ...baseVm } as any;

      const validationPassed = rke2.computed!.validationPassed.call(vm);

      expect(validationPassed).toBe(true);
    });

    it('should return false when provisioningClusterValid is false and isUpstreamCAPIProvider is true', () => {
      const vm = { ...baseVm, provisioningClusterValid: false } as any;

      const validationPassed = rke2.computed!.validationPassed.call(vm);

      expect(validationPassed).toBe(false);
    });

    it('should ignore provisioningClusterValid when isUpstreamCAPIProvider is false', () => {
      const vm = {
        ...baseVm, provisioningClusterValid: false, isUpstreamCAPIProvider: false
      } as any;

      const validationPassed = rke2.computed!.validationPassed.call(vm);

      expect(validationPassed).toBe(true);
    });
  });

  describe('methods: updateExtensionProvisioningSection', () => {
    it('should do nothing when the emitted value is not an object', () => {
      const originalValue = { spec: { foo: 'bar' } };
      const vm = { value: originalValue } as any;

      (rke2.methods as any).updateExtensionProvisioningSection.call(vm, null);

      expect(vm.value).toBe(originalValue);
      expect(vm.value).toStrictEqual({ spec: { foo: 'bar' } });
    });

    it('should assign the emitted value directly when there is no existing value', () => {
      const vm = { value: null } as any;
      const neu = { spec: { kubernetesVersion: 'v1.31.0+rke2r1' } };

      (rke2.methods as any).updateExtensionProvisioningSection.call(vm, neu);

      expect(vm.value).toBe(neu);
    });

    it('should merge the emitted value into the existing value, preserving the original reference', () => {
      const original = { spec: { kubernetesVersion: 'v1.30.0+rke2r1', existing: 'field' } };
      const vm = { value: original } as any;
      const neu = { spec: { kubernetesVersion: 'v1.31.0+rke2r1' } };

      (rke2.methods as any).updateExtensionProvisioningSection.call(vm, neu);

      expect(vm.value).toBe(original);
      expect(vm.value.spec.kubernetesVersion).toBe('v1.31.0+rke2r1');
      expect(vm.value.spec.existing).toBe('field');
    });
  });

  // Characterization tests written ahead of extracting Kubernetes-version resolution
  // (versionOptions/selectedVersion/chartVersions/defaultVersion/fetchK8sVersions/cloudProviderOptions)
  // into a composable.
  describe('kubernetes version resolution', () => {
    const version = (id: string, overrides: Record<string, any> = {}) => ({
      id, serverArgs: {}, agentArgs: {}, charts: {}, ...overrides
    });

    const baseVm = {
      mode:                        _CREATE,
      value:                       { spec: {} },
      liveValue:                   { spec: {} },
      agentConfig:                 {},
      showDeprecatedPatchVersions: true,
      rke2Versions:                [] as any[],
      k3sVersions:                 [] as any[],
      defaultRke2:                 '',
      defaultK3s:                  '',
      isHarvesterDriver:           false,
      $store:                      { getters: { 'i18n/t': (key: string) => key } },
      t:                           (key: string) => key,
    };

    describe('defaultVersion', () => {
      it('prefers the version matching the defaultRke2 setting when present among version options', () => {
        const vm = {
          ...baseVm,
          versionOptions: [{ value: 'v1.29.0+rke2r1' }, { value: 'v1.28.0+rke2r1' }],
          defaultRke2:    'v1.28.0+rke2r1',
          rke2Versions:   [],
        };

        expect((rke2.computed as any).defaultVersion.call(vm)).toBe('v1.28.0+rke2r1');
      });

      it('falls back to the first version option when defaultRke2 is not among the options', () => {
        const vm = {
          ...baseVm,
          versionOptions: [{ value: 'v1.29.0+rke2r1' }, { value: 'v1.28.0+rke2r1' }],
          defaultRke2:    'v1.99.0+rke2r1',
          rke2Versions:   [],
        };

        expect((rke2.computed as any).defaultVersion.call(vm)).toBe('v1.29.0+rke2r1');
      });

      it('prefers the first Harvester-compatible rke2 version when on the Harvester driver', () => {
        const vm = {
          ...baseVm,
          versionOptions:    [{ value: 'v1.29.0+rke2r1' }],
          defaultRke2:       '',
          isHarvesterDriver: true,
          rke2Versions:      [version('v1.20.0+rke2r1'), version('v1.25.0+rke2r1')],
        };

        expect((rke2.computed as any).defaultVersion.call(vm)).toBe('v1.25.0+rke2r1');
      });
    });

    describe('cloudProviderOptions', () => {
      const cpBaseVm = () => ({
        provider:                      'custom',
        agentConfig:                   {},
        isHarvesterExternalCredential: false,
        isHarvesterIncompatible:       false,
        $store:                        {
          getters: {
            'i18n/t':                         (key: string) => key,
            'i18n/withFallback':              (_key: string, _fallback: any, opt: string) => opt,
            'plugins/cloudProviderForDriver': () => undefined,
          },
        },
      });

      it('always excludes the azure option, even when the driver lists it', () => {
        const vm = { ...cpBaseVm(), agentArgs: { 'cloud-provider-name': { options: ['azure', 'amazon'] } } };

        const options = (rke2.computed as any).cloudProviderOptions.call(vm);

        expect(options.find((o: any) => o.value === 'azure')).toBeUndefined();
        expect(options.find((o: any) => o.value === 'amazon')).toBeDefined();
      });

      it('shows every non-azure option when there is no preferred provider', () => {
        const vm = { ...cpBaseVm(), agentArgs: { 'cloud-provider-name': { options: ['amazon', 'external', 'vsphere'] } } };

        const options = (rke2.computed as any).cloudProviderOptions.call(vm);

        expect(options.map((o: any) => o.value)).toStrictEqual(['', 'amazon', 'external', 'vsphere']);
      });

      it('only shows the default, preferred and external options when a preferred provider exists', () => {
        const base = cpBaseVm();
        const vm = {
          ...base,
          $store:    { getters: { ...base.$store.getters, 'plugins/cloudProviderForDriver': () => 'vsphere' } },
          agentArgs: { 'cloud-provider-name': { options: ['amazon', 'external', 'vsphere'] } },
        };

        const options = (rke2.computed as any).cloudProviderOptions.call(vm);

        expect(options.map((o: any) => o.value)).toStrictEqual(['', 'external', 'vsphere']);
      });

      it('disables the preferred option when the Harvester credential is external or incompatible', () => {
        const base = cpBaseVm();
        const vm = {
          ...base,
          isHarvesterIncompatible: true,
          $store:                  { getters: { ...base.$store.getters, 'plugins/cloudProviderForDriver': () => 'harvester' } },
          agentArgs:               { 'cloud-provider-name': { options: ['harvester', 'external'] } },
        };

        const options = (rke2.computed as any).cloudProviderOptions.call(vm);

        expect(options.find((o: any) => o.value === 'harvester').disabled).toBe(true);
      });

      it('prepends the current cloud provider as "(Current)" when it is not among the listed options', () => {
        const vm = {
          ...cpBaseVm(),
          agentConfig: { 'cloud-provider-name': 'legacy-provider' },
          agentArgs:   { 'cloud-provider-name': { options: ['amazon'] } },
        };

        const options = (rke2.computed as any).cloudProviderOptions.call(vm);

        expect(options[0]).toStrictEqual({ label: 'legacy-provider (Current)', value: 'legacy-provider' });
      });
    });
  });

  // Characterization tests written ahead of extracting machine-pool orchestration into a composable.
  describe('methods: removeMachinePool', () => {
    it('does nothing when the index does not exist', () => {
      const vm: any = { machinePools: [{ create: true }] };

      (rke2.methods as any).removeMachinePool.call(vm, 5);

      expect(vm.machinePools).toHaveLength(1);
    });

    it('drops a not-yet-saved pool entirely', () => {
      const pool = { create: true };
      const vm: any = { machinePools: [pool] };

      (rke2.methods as any).removeMachinePool.call(vm, 0);

      expect(vm.machinePools).toHaveLength(0);
    });

    it('marks an existing pool for removal instead of deleting it', () => {
      const pool: { create: boolean; remove?: boolean } = { create: false };
      const vm: any = { machinePools: [pool] };

      (rke2.methods as any).removeMachinePool.call(vm, 0);

      expect(vm.machinePools).toHaveLength(1);
      expect(pool.remove).toBe(true);
    });
  });

  describe('methods: machinePoolValidationChanged', () => {
    it('records the validation state for a pool', () => {
      const vm: any = { machinePoolValidation: {} };

      (rke2.methods as any).machinePoolValidationChanged.call(vm, 'pool-1', false);

      expect(vm.machinePoolValidation['pool-1']).toBe(false);
    });

    it('removes the entry when the value is undefined', () => {
      const vm: any = { machinePoolValidation: { 'pool-1': false } };

      (rke2.methods as any).machinePoolValidationChanged.call(vm, 'pool-1', undefined);

      expect(vm.machinePoolValidation).not.toHaveProperty('pool-1');
    });
  });

  // Characterization tests written ahead of extracting registry configuration into a composable.
  describe('methods: initRegistry', () => {
    const buildVm = (overrides: Record<string, any> = {}) => {
      const { systemRegistryValue, ...rest } = overrides;

      return {
        agentConfig: {},
        rkeConfig:   {},
        ...rest,
        $store:      { dispatch: jest.fn().mockResolvedValue({ value: systemRegistryValue ?? '' }) },
      } as any;
    };

    it('prefers the cluster-scoped registry over the global system registry', async() => {
      const vm = buildVm({ agentConfig: { 'system-default-registry': 'cluster.registry.io' }, systemRegistryValue: 'global.registry.io' });

      await (rke2.methods as any).initRegistry.call(vm);

      expect(vm.registryHost).toBe('cluster.registry.io');
    });

    it('falls back to the global system registry when no cluster-scoped registry is set', async() => {
      const vm = buildVm({ systemRegistryValue: 'global.registry.io' });

      await (rke2.methods as any).initRegistry.call(vm);

      expect(vm.registryHost).toBe('global.registry.io');
      expect(vm.systemRegistry).toBe('global.registry.io');
    });

    it('initializes empty registries/configs/mirrors when none exist', async() => {
      const vm = buildVm();

      await (rke2.methods as any).initRegistry.call(vm);

      expect(vm.rkeConfig.registries).toStrictEqual({ configs: {}, mirrors: {} });
    });

    it('picks up an existing auth secret for the resolved registry host and shows the custom registry input', async() => {
      const vm = buildVm({
        systemRegistryValue: 'my.registry.io',
        rkeConfig:           { registries: { configs: { 'my.registry.io': { authConfigSecretName: 'my-secret' } } } },
      });

      await (rke2.methods as any).initRegistry.call(vm);

      expect(vm.registrySecret).toBe('my-secret');
      expect(vm.showCustomRegistryInput).toBe(true);
    });

    it('shows the advanced registry input when mirrors are configured', async() => {
      const vm = buildVm({ rkeConfig: { registries: { mirrors: { 'docker.io': { endpoint: ['https://mirror.example.com'] } } } } });

      await (rke2.methods as any).initRegistry.call(vm);

      expect(vm.showCustomRegistryAdvancedInput).toBe(true);
    });
  });

  describe('methods: setRegistryConfig', () => {
    it('clears the override when there is no hostname and a system registry is set', () => {
      const vm: any = {
        registryHost: '', systemRegistry: 'global.registry.io', registrySecret: null, agentConfig: {}, value: { spec: {} }
      };

      (rke2.methods as any).setRegistryConfig.call(vm);

      expect(vm.agentConfig['system-default-registry']).toBeUndefined();
    });

    it('clears the override when the hostname matches the system registry', () => {
      const vm: any = {
        registryHost: 'global.registry.io', systemRegistry: 'global.registry.io', registrySecret: null, agentConfig: {}, value: { spec: {} }
      };

      (rke2.methods as any).setRegistryConfig.call(vm);

      expect(vm.agentConfig['system-default-registry']).toBeUndefined();
    });

    it('sets the override to the hostname when it differs from the system registry', () => {
      const vm: any = {
        registryHost: 'custom.registry.io', systemRegistry: 'global.registry.io', registrySecret: null, agentConfig: {}, value: { spec: {} }
      };

      (rke2.methods as any).setRegistryConfig.call(vm);

      expect(vm.agentConfig['system-default-registry']).toBe('custom.registry.io');
    });

    it('sets the override to the hostname when there is no system registry', () => {
      const vm: any = {
        registryHost: 'custom.registry.io', systemRegistry: '', registrySecret: null, agentConfig: {}, value: { spec: {} }
      };

      (rke2.methods as any).setRegistryConfig.call(vm);

      expect(vm.agentConfig['system-default-registry']).toBe('custom.registry.io');
    });

    it('creates rkeConfig with the basic auth config when none exists', () => {
      const vm: any = {
        registryHost: 'custom.registry.io', systemRegistry: '', registrySecret: 'my-secret', agentConfig: {}, value: { spec: {} }
      };

      (rke2.methods as any).setRegistryConfig.call(vm);

      expect(vm.value.spec.rkeConfig.registries.configs['custom.registry.io']).toStrictEqual({
        authConfigSecretName: 'my-secret', caBundle: null, insecureSkipVerify: false, tlsSecretName: null,
      });
    });

    it('merges the basic auth config alongside existing registry configs', () => {
      const vm: any = {
        registryHost:   'custom.registry.io',
        systemRegistry: '',
        registrySecret: 'my-secret',
        agentConfig:    {},
        value:          { spec: { rkeConfig: { registries: { configs: { 'other.registry.io': { authConfigSecretName: 'other-secret' } } } } } },
      };

      (rke2.methods as any).setRegistryConfig.call(vm);

      const configs = vm.value.spec.rkeConfig.registries.configs;

      expect(Object.keys(configs).sort()).toStrictEqual(['custom.registry.io', 'other.registry.io']);
    });

    it('adds a configs entry alongside existing mirrors when no configs exist yet', () => {
      const vm: any = {
        registryHost:   'custom.registry.io',
        systemRegistry: '',
        registrySecret: 'my-secret',
        agentConfig:    {},
        value:          { spec: { rkeConfig: { registries: { mirrors: { 'docker.io': {} } } } } },
      };

      (rke2.methods as any).setRegistryConfig.call(vm);

      expect(vm.value.spec.rkeConfig.registries.mirrors).toStrictEqual({ 'docker.io': {} });
      expect(vm.value.spec.rkeConfig.registries.configs['custom.registry.io']).toBeDefined();
    });
  });

  describe('methods: updateConfigs', () => {
    it('initializes rkeConfig when missing and sets the configs', () => {
      const vm: any = { value: { spec: {} } };
      const configs = { 'registry.io': {} };

      (rke2.methods as any).updateConfigs.call(vm, configs);

      expect(vm.value.spec.rkeConfig.registries.configs).toBe(configs);
    });

    it('sets the configs on an existing rkeConfig', () => {
      const vm: any = { value: { spec: { rkeConfig: { registries: {} } } } };
      const configs = { 'registry.io': {} };

      (rke2.methods as any).updateConfigs.call(vm, configs);

      expect(vm.value.spec.rkeConfig.registries.configs).toBe(configs);
    });
  });

  describe('methods: registry input handlers', () => {
    it('updates the registry host', () => {
      const vm: any = { registryHost: null };

      (rke2.methods as any).handleRegistryHostChanged.call(vm, 'registry.io');

      expect(vm.registryHost).toBe('registry.io');
    });

    it('updates the registry secret', () => {
      const vm: any = { registrySecret: null };

      (rke2.methods as any).handleRegistrySecretChanged.call(vm, 'my-secret');

      expect(vm.registrySecret).toBe('my-secret');
    });

    describe('toggleCustomRegistry', () => {
      it('sets showCustomRegistryInput and clears an existing host/secret', () => {
        const vm: any = {
          showCustomRegistryInput: false, registryHost: 'registry.io', registrySecret: 'secret', initRegistry: jest.fn(),
        };

        (rke2.methods as any).toggleCustomRegistry.call(vm, true);

        expect(vm.showCustomRegistryInput).toBe(true);
        expect(vm.registryHost).toBeNull();
        expect(vm.registrySecret).toBeNull();
        expect(vm.initRegistry).not.toHaveBeenCalled();
      });

      it('re-initializes the registry when there is no existing host', () => {
        const vm: any = {
          showCustomRegistryInput: false, registryHost: null, registrySecret: null, initRegistry: jest.fn(),
        };

        (rke2.methods as any).toggleCustomRegistry.call(vm, true);

        expect(vm.initRegistry).toHaveBeenCalledWith();
      });
    });
  });

  // Characterization tests written ahead of extracting chart/addon value handling into a composable.
  describe('methods: getChartValue', () => {
    it('does nothing when there is no chart version entry for the chart', async() => {
      const dispatch = jest.fn();
      const vm: any = {
        chartVersions: {}, versionInfo: {}, userChartValues: {}, $store: { dispatch }, chartVersionKey: (n: string) => n,
      };

      await (rke2.methods as any).getChartValue.call(vm, 'rke2-ingress-nginx');

      expect(dispatch).not.toHaveBeenCalled();
    });

    it('fetches and stores version info, initializing empty user chart values', async() => {
      const versionInfo = { questions: [] };
      const dispatch = jest.fn().mockResolvedValue(versionInfo);
      const vm: any = {
        chartVersions:   { 'rke2-ingress-nginx': { repo: 'rke2-charts', version: '1.0.0' } },
        versionInfo:     {},
        userChartValues: {},
        $store:          { dispatch },
        chartVersionKey: (n: string) => n,
      };

      await (rke2.methods as any).getChartValue.call(vm, 'rke2-ingress-nginx');

      expect(dispatch).toHaveBeenCalledWith('catalog/getVersionInfo', {
        repoType: 'cluster', repoName: 'rke2-charts', chartName: 'rke2-ingress-nginx', versionName: '1.0.0',
      });
      expect(vm.versionInfo['rke2-ingress-nginx']).toBe(versionInfo);
      expect(vm.userChartValues['rke2-ingress-nginx']).toStrictEqual({});
    });

    it('does not overwrite existing user chart values', async() => {
      const dispatch = jest.fn().mockResolvedValue({});
      const existing = { foo: 'bar' };
      const vm: any = {
        chartVersions:   { 'rke2-ingress-nginx': { repo: 'rke2-charts', version: '1.0.0' } },
        versionInfo:     {},
        userChartValues: { 'rke2-ingress-nginx': existing },
        $store:          { dispatch },
        chartVersionKey: (n: string) => n,
      };

      await (rke2.methods as any).getChartValue.call(vm, 'rke2-ingress-nginx');

      expect(vm.userChartValues['rke2-ingress-nginx']).toBe(existing);
    });

    it('swallows dispatch errors without throwing', async() => {
      const dispatch = jest.fn().mockRejectedValue(new Error('network error'));
      const vm: any = {
        chartVersions:   { 'rke2-ingress-nginx': { repo: 'rke2-charts', version: '1.0.0' } },
        versionInfo:     {},
        userChartValues: {},
        $store:          { dispatch },
        chartVersionKey: (n: string) => n,
      };

      await expect((rke2.methods as any).getChartValue.call(vm, 'rke2-ingress-nginx')).resolves.toBeUndefined();
    });
  });

  describe('methods: initAddons', () => {
    it('skips charts that already have version info cached', async() => {
      const getChartValue = jest.fn();
      const vm: any = {
        addonConfigValidation: { stale: true }, isK3s: true, addonNames: ['rke2-cilium'], versionInfo: { 'rke2-cilium': {} }, getChartValue,
      };

      await (rke2.methods as any).initAddons.call(vm);

      expect(getChartValue).not.toHaveBeenCalled();
      expect(vm.addonConfigValidation).toStrictEqual({});
    });

    it('skips the "none" CNI placeholder chart', async() => {
      const getChartValue = jest.fn();
      const vm: any = {
        addonConfigValidation: {}, isK3s: true, addonNames: ['none'], versionInfo: {}, getChartValue,
      };

      await (rke2.methods as any).initAddons.call(vm);

      expect(getChartValue).not.toHaveBeenCalled();
    });

    it('fetches remaining addon charts', async() => {
      const getChartValue = jest.fn();
      const vm: any = {
        addonConfigValidation: {}, isK3s: true, addonNames: ['rke2-cilium'], versionInfo: {}, getChartValue,
      };

      await (rke2.methods as any).initAddons.call(vm);

      expect(getChartValue).toHaveBeenCalledWith('rke2-cilium');
    });

    it('also fetches the ingress charts for RKE2 (not K3s) clusters', async() => {
      const getChartValue = jest.fn();
      const vm: any = {
        addonConfigValidation: {}, isK3s: false, addonNames: [], versionInfo: {}, getChartValue,
      };

      await (rke2.methods as any).initAddons.call(vm);

      expect(getChartValue).toHaveBeenCalledWith('rke2-ingress-nginx');
      expect(getChartValue).toHaveBeenCalledWith('rke2-traefik');
    });

    it('does not fetch ingress charts for K3s clusters', async() => {
      const getChartValue = jest.fn();
      const vm: any = {
        addonConfigValidation: {}, isK3s: true, addonNames: [], versionInfo: {}, getChartValue,
      };

      await (rke2.methods as any).initAddons.call(vm);

      expect(getChartValue).not.toHaveBeenCalled();
    });
  });

  describe('methods: refreshYamls', () => {
    it('calls refresh on yaml-prefixed refs, ignoring others', () => {
      const yamlRef = { refresh: jest.fn() };
      const otherRef = { refresh: jest.fn() };
      const vm: any = {};

      (rke2.methods as any).refreshYamls.call(vm, { yamlEditor: yamlRef, somethingElse: otherRef });

      expect(yamlRef.refresh).toHaveBeenCalledWith();
      expect(otherRef.refresh).not.toHaveBeenCalled();
    });

    it('refreshes every entry when the ref is an array', () => {
      const first = { refresh: jest.fn() };
      const second = { refresh: jest.fn() };
      const vm: any = {};

      (rke2.methods as any).refreshYamls.call(vm, { yamlEditor: [first, second] });

      expect(first.refresh).toHaveBeenCalledWith();
      expect(second.refresh).toHaveBeenCalledWith();
    });

    it('tolerates an undefined ref entry without throwing', () => {
      const vm: any = {};

      expect(() => (rke2.methods as any).refreshYamls.call(vm, { yamlEditor: undefined })).not.toThrow();
    });
  });

  describe('methods: showAddonConfirmation', () => {
    it('resolves with the value passed to the confirmation dialog callback', async() => {
      const dispatch = jest.fn((_action: string, opts: any) => {
        opts.resources[0](true);
      });
      const vm: any = { $store: { dispatch } };

      const result = await (rke2.methods as any).showAddonConfirmation.call(vm, ['rke2-cilium'], 'v1.27.0', 'v1.28.0');

      expect(result).toBe(true);
      expect(dispatch).toHaveBeenCalledWith('cluster/promptModal', expect.objectContaining({
        component:      'AddonConfigConfirmationDialog',
        componentProps: {
          addonNames: ['rke2-cilium'], previousKubeVersion: 'v1.27.0', newKubeVersion: 'v1.28.0'
        },
      }));
    });
  });

  describe('methods: chartVersionKey', () => {
    it('returns a version-qualified key when a matching addon version exists', () => {
      const vm: any = { addonVersions: [{ name: 'rke2-cilium', version: '1.2.3' }] };

      expect((rke2.methods as any).chartVersionKey.call(vm, 'rke2-cilium')).toBe('rke2-cilium-1.2.3');
    });

    it('returns the plain chart name when there is no matching addon version', () => {
      const vm: any = { addonVersions: [] };

      expect((rke2.methods as any).chartVersionKey.call(vm, 'rke2-cilium')).toBe('rke2-cilium');
    });
  });

  // Characterization tests written ahead of extracting vSphere/Harvester cloud-provider wiring into a composable.
  describe('computed: isHarvesterIncompatible', () => {
    it('returns false when no Harvester version range info is present', () => {
      const vm: any = { chartVersions: {}, harvesterVersionRange: {} };

      expect((rke2.computed as any).isHarvesterIncompatible.call(vm)).toBe(false);
    });

    it('returns false when installed chart versions satisfy the Harvester version range', () => {
      const vm: any = {
        chartVersions: {
          'harvester-cloud-provider': { version: '1.2.3' },
          'harvester-csi-driver':     { version: '1.2.3' },
        },
        harvesterVersionRange: {
          'harvester-cloud-provider': '>=1.0.0',
          'harvester-csi-provider':   '>=1.0.0',
        },
      };

      expect((rke2.computed as any).isHarvesterIncompatible.call(vm)).toBe(false);
    });

    it('returns true when installed chart versions do not satisfy the Harvester version range', () => {
      const vm: any = {
        chartVersions: {
          'harvester-cloud-provider': { version: '0.5.0' },
          'harvester-csi-driver':     { version: '0.5.0' },
        },
        harvesterVersionRange: {
          'harvester-cloud-provider': '>=1.0.0',
          'harvester-csi-provider':   '>=1.0.0',
        },
      };

      expect((rke2.computed as any).isHarvesterIncompatible.call(vm)).toBe(true);
    });

    it('strips a trailing "00" patch suffix from the chart version before comparing', () => {
      const vm: any = {
        chartVersions: {
          'harvester-cloud-provider': { version: '1.2.300' },
          'harvester-csi-driver':     { version: '1.2.300' },
        },
        harvesterVersionRange: {
          'harvester-cloud-provider': '1.2.3',
          'harvester-csi-provider':   '1.2.3',
        },
      };

      expect((rke2.computed as any).isHarvesterIncompatible.call(vm)).toBe(false);
    });
  });

  describe('methods: setHarvesterDefaultCloudProvider', () => {
    it('sets the cloud provider to harvester when on the Harvester driver, creating, with no existing provider and no incompatibility', () => {
      const vm: any = {
        isHarvesterDriver: true, mode: _CREATE, agentConfig: {}, isHarvesterExternalCredential: false, isHarvesterIncompatible: false,
      };

      (rke2.methods as any).setHarvesterDefaultCloudProvider.call(vm);

      expect(vm.agentConfig['cloud-provider-name']).toBe('harvester');
    });

    it('clears the cloud provider when not on the Harvester driver', () => {
      const vm: any = {
        isHarvesterDriver: false, mode: _CREATE, agentConfig: {}, isHarvesterExternalCredential: false, isHarvesterIncompatible: false,
      };

      (rke2.methods as any).setHarvesterDefaultCloudProvider.call(vm);

      expect(vm.agentConfig['cloud-provider-name']).toBe('');
    });

    it('clears the cloud provider when the installed charts are Harvester-incompatible', () => {
      const vm: any = {
        isHarvesterDriver: true, mode: _CREATE, agentConfig: {}, isHarvesterExternalCredential: false, isHarvesterIncompatible: true,
      };

      (rke2.methods as any).setHarvesterDefaultCloudProvider.call(vm);

      expect(vm.agentConfig['cloud-provider-name']).toBe('');
    });
  });
});
