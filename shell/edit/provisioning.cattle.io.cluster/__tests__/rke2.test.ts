import { mount, shallowMount } from '@vue/test-utils';
import rke2 from '@shell/edit/provisioning.cattle.io.cluster/rke2.vue';

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

const defaultComputed = {
  showForm() {
    return true;
  },
  versionOptions() {
    return [
      {
        id: 'v1.25.0+rke2r1', value: 'v1.25.0+rke2r1', serverArgs: {}, agentArgs: mockAgentArgs, charts: {}
      },
      {
        id: 'v1.24.0+rke2r1', value: 'v1.24.0+rke2r1', serverArgs: {}, agentArgs: mockAgentArgs, charts: {}
      },
      {
        id: 'v1.23.0+rke2r1', value: 'v1.23.0+rke2r1', serverArgs: {}, agentArgs: mockAgentArgs, charts: {}
      },
      {
        id: 'v1.25.0+k3s1', value: 'v1.25.0+k3s1', serverArgs: {}, agentArgs: mockAgentArgs, charts: {}
      },
      {
        id: 'v1.24.0+k3s1', value: 'v1.24.0+k3s1', serverArgs: {}, agentArgs: mockAgentArgs, charts: {}
      }
    ];
  }
};

const defaultGetters = {
  currentStore:                     () => 'current_store',
  'management/schemaFor':           jest.fn(),
  'current_store/all':              jest.fn(),
  'i18n/t':                         jest.fn(),
  'i18n/withFallback':              jest.fn(),
  'plugins/cloudProviderForDriver': jest.fn()
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
      propsData: {
        mode:  'create',
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
      computed: defaultComputed,
      mocks:    {
        ...defaultMocks,
        $store: { getters: defaultGetters },
      },
      stubs: defaultStubs
    });

    expect((wrapper.vm as any).validationPassed).toBe(result);
  });

  it('should allow creation of K3 clusters if pool machines are missing', () => {
    const k8s = 'v1.25.0+k3s1';
    const wrapper = mount(rke2, {
      propsData: {
        mode:  'create',
        value: {
          spec: {
            ...defaultSpec,
            kubernetesVersion: k8s
          },
          agentConfig: { 'cloud-provider-name': 'any' }
        },
        provider: 'custom'
      },
      data:     () => ({ credentialId: 'I am authenticated' }),
      computed: defaultComputed,
      mocks:    {
        ...defaultMocks,
        $store: { getters: defaultGetters },
      },
      stubs: defaultStubs
    });

    expect((wrapper.vm as any).validationPassed).toBe(true);
  });

  it('should initialize machine pools with drain before delete true', async() => {
    const k8s = 'v1.25.0+k3s1';
    const wrapper = mount(rke2, {
      propsData: {
        mode:  'create',
        value: {
          spec: {
            ...defaultSpec,
            kubernetesVersion: k8s
          },
          agentConfig: { 'cloud-provider-name': 'any' }
        },
        provider: 'custom'
      },
      data:     () => ({ credentialId: 'I am authenticated' }),
      computed: defaultComputed,
      mocks:    {
        ...defaultMocks,
        $store: { getters: defaultGetters },
      },
      stubs: defaultStubs
    });

    await wrapper.vm.initSpecs();

    wrapper.vm.machinePools.forEach((p: any) => expect(p.drainBeforeDelete).toBe(true));
  });

  // TODO: Complete test after implementing fetch https://github.com/rancher/dashboard/issues/9322
  // eslint-disable-next-line jest/no-disabled-tests
  describe.skip('should initialize agent configuration values', () => {
    it('adding default values if none', async() => {
      const wrapper = shallowMount(rke2, {
        propsData: {
          mode:  'create',
          value: {
            spec:        { ...defaultSpec },
            agentConfig: { 'cloud-provider-name': 'any' }
          },
          provider: 'custom'
        },
        computed: defaultComputed,
        mocks:    {
          ...defaultMocks,
          $store: {
            getters:  defaultGetters,
            dispatch: {
              'management/request': jest.fn(),
              'management/find':    jest.fn(),
              'management/findAll': () => ([]),
            }
          },
        },
        stubs: defaultStubs
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
        propsData: {
          mode:  'create',
          value: {
            spec:        { ...defaultSpec },
            agentConfig: { 'cloud-provider-name': 'any' }
          },
          provider: 'custom'
        },
        computed: defaultComputed,
        mocks:    {
          ...defaultMocks,
          $store: {
            getters:  defaultGetters,
            dispatch: {
              'management/request': jest.fn(),
              'management/find':    jest.fn(),
              'management/findAll': () => ([]),
            }
          },
        },
        stubs: defaultStubs
      });
      const agent = wrapper.find('[data-testid="rke2-cluster-agent-config"]');

      // Setting RKE to avoid calls
      wrapper.setData({ rke2Versions: [] });

      await rke2.fetch.call(wrapper.vm);

      expect(agent.element).toBeDefined();
    });
  });
});
