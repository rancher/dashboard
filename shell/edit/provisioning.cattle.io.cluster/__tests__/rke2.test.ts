import { mount } from '@vue/test-utils';
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
};

const defaultComputed = {
  showForm() {
    return true;
  },
  showk8s21LegacyWarning() {
    return false;
  },
};

const defaultGetters = {
  currentStore:           () => 'current_store',
  'management/schemaFor': jest.fn(),
  'current_store/all':    jest.fn(),
  'i18n/t':               jest.fn(),
  'i18n/withFallback':    jest.fn(),
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
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  it.each([
    'v1.25.0+rke2r1',
    'v1.24.0+rke2r1',
    'v1.23.0+rke2r1',
    'v1.25.0+k3s1',
    'v1.24.0+k3s1',
    'v1.23.0+k3s1',
  ])('should display PSA option', (k8s) => {
    const label = 'whatever';
    const option = { label, value: label };
    const wrapper = mount(rke2, {
      propsData: {
        mode:  'create',
        value: {
          spec: {
            ...defaultSpec,
            defaultPodSecurityAdmissionConfigurationTemplateName: label,
            kubernetesVersion:                                    k8s
          }
        },
        provider: 'whatever',
      },
      computed: defaultComputed,
      mocks:    {
        ...defaultMocks,
        $store: {
          getters:  defaultGetters,
          dispatch: {
            'management/find':    jest.fn(),
            'management/findAll': () => ([option]),
          }
        },
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
    const option = { label, value: label };
    const wrapper = mount(rke2, {
      propsData: {
        mode:  'create',
        value: {
          spec: {
            ...defaultSpec,
            defaultPodSecurityAdmissionConfigurationTemplateName: label,
            kubernetesVersion:                                    k8s
          }
        },
        provider: 'whatever',
      },
      computed: defaultComputed,
      mocks:    {
        ...defaultMocks,
        $store: {
          getters:  defaultGetters,
          dispatch: {
            'management/find':    jest.fn(),
            'management/findAll': () => ([option]),
          }
        },
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
    const option = { label, value: label };
    const wrapper = mount(rke2, {
      propsData: {
        mode:  'create',
        value: {
          agentConfig: { profile: cis },
          spec:        {
            ...defaultSpec,
            defaultPodSecurityAdmissionConfigurationTemplateName: label,
            kubernetesVersion:                                    k8s
          }
        },
        provider: 'custom',
      },
      computed: {
        ...defaultComputed,
        agentArgs:      () => ({ profile: { options: [cis] } }),
        versionOptions: () => [
          {
            value:     k8s,
            agentArgs: { profile: { options: [cis] } },
            charts:    {},
            profile:   { options: [cis] }
          }
        ]
      },
      mocks: {
        ...defaultMocks,
        $store: {
          getters:  defaultGetters,
          dispatch: {
            'management/find':    jest.fn(),
            'management/findAll': () => ([option]),
          }
        },
      },
      stubs: defaultStubs
    });

    wrapper.setData({ cisOverride: override });

    const select = wrapper.find('[data-testid="rke2-custom-edit-psa"]');

    expect((select.vm as unknown as any).disabled).toBe(disabled);
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

          }
        },
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
          }
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
});
