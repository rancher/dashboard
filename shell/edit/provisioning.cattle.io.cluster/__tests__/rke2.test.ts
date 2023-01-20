import { mount } from '@vue/test-utils';
import rke2 from '@shell/edit/provisioning.cattle.io.cluster/rke2.vue';

describe('component: rke2', () => {
  // Disable existing log to avoid pollution
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
            rkeConfig:                                            { etcd: { disableSnapshots: false } },
            chartValues:                                          {},
            defaultPodSecurityAdmissionConfigurationTemplateName: label,
            kubernetesVersion:                                    k8s
          }
        },
        provider: 'whatever',
        resource: {}
      },
      computed: {
        showForm() {
          return true;
        },
        hasMachinePools() {
          return false;
        },
        showk8s21LegacyWarning() {
          return false;
        },
      },
      mocks: {
        $fetchState: { pending: false },
        $route:      {
          name:  'anything',
          query: { AS: 'yaml' },
        },
        $store: {
          getters: {
            currentStore:           () => 'current_store',
            'management/schemaFor': jest.fn(),
            'current_store/all':    jest.fn(),
            'i18n/t':               jest.fn(),
            'i18n/withFallback':    jest.fn(),
          },
          dispatch: {
            'management/find':    jest.fn(),
            'management/findAll': () => ([option]),
          }
        },
      },
      stubs: {
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
      }
    });

    const select = wrapper.find('[data-testid="rke2-custom-edit-psa"]');

    expect((select.vm as unknown as any).options[0].label).toBe(`${ label } (Current)`);
  });

  it.each([
    ['v1.25.0+rke2r1', '(None)'],
    ['v1.24.0+rke2r1', 'Rancher Default'],
    ['v1.23.0+rke2r1', 'Rancher Default'],
    ['v1.25.0+k3s1', '(None)'],
    ['v1.24.0+k3s1', 'Rancher Default'],
    ['v1.23.0+k3s1', 'Rancher Default'],
  ])('should display for version %p PSA option label %p', (k8s, label) => {
    const option = { label, value: label };
    const wrapper = mount(rke2, {
      propsData: {
        mode:  'create',
        value: {
          spec: {
            rkeConfig:                                            { etcd: { disableSnapshots: false } },
            chartValues:                                          {},
            defaultPodSecurityAdmissionConfigurationTemplateName: label,
            kubernetesVersion:                                    k8s
          }
        },
        provider: 'whatever',
        resource: {}
      },
      computed: {
        showForm() {
          return true;
        },
        hasMachinePools() {
          return false;
        },
        showk8s21LegacyWarning() {
          return false;
        },
      },
      mocks: {
        $fetchState: { pending: false },
        $route:      {
          name:  'anything',
          query: { AS: 'yaml' },
        },
        $store: {
          getters: {
            currentStore:           () => 'current_store',
            'management/schemaFor': jest.fn(),
            'current_store/all':    jest.fn(),
            'i18n/t':               jest.fn(),
            'i18n/withFallback':    jest.fn(),
          },
          dispatch: {
            'management/find':    jest.fn(),
            'management/findAll': () => ([option]),
          }
        },
      },
      stubs: {
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
      }
    });

    const select = wrapper.find('[data-testid="rke2-custom-edit-psa"]');

    expect((select.vm as unknown as any).options[0].label).toBe(`${ label } (Current)`);
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
            rkeConfig:                                            { etcd: { disableSnapshots: false } },
            chartValues:                                          {},
            defaultPodSecurityAdmissionConfigurationTemplateName: label,
            kubernetesVersion:                                    k8s
          }
        },
        provider: 'custom',
        resource: {}
      },
      computed: {
        showForm() {
          return true;
        },
        hasMachinePools() {
          return false;
        },
        showk8s21LegacyWarning() {
          return false;
        },
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
        $fetchState: { pending: false },
        $route:      {
          name:  'anything',
          query: { AS: 'yaml' },
        },
        $store: {
          getters: {
            currentStore:           () => 'current_store',
            'management/schemaFor': jest.fn(),
            'current_store/all':    jest.fn(),
            'i18n/t':               jest.fn(),
            'i18n/withFallback':    jest.fn(),
          },
          dispatch: {
            'management/find':    jest.fn(),
            'management/findAll': () => ([option]),
          }
        },
      },
      stubs: {
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
      }
    });

    wrapper.setData({ cisOverride: override });

    const select = wrapper.find('[data-testid="rke2-custom-edit-psa"]');

    expect((select.vm as unknown as any).disabled).toBe(disabled);
  });
});
