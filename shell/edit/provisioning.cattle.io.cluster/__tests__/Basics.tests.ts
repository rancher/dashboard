import { mount } from '@vue/test-utils';
import Basics from '@shell/edit/provisioning.cattle.io.cluster/Basics';

const defaultStubs = {
  Tab:           { template: '<div><slot></slot></div>' }, // Required to render the slot content
  Banner:        true,
  LabeledSelect: true,
  YamlEditor:    true,
  Checkbox:      true
};

const defaultComputed = {
  showk8s21LegacyWarning() {
    return false;
  },
};
const versionsInfoMock = {
  allPSPs:      [],
  allPSAs:      [],
  rke2Versions: {
    data: [
      {
        id: 'v1.25.0+rke2r1', serverArgs: {}, agentArgs: {}, charts: {}
      },
      {
        id: 'v1.24.0+rke2r1', serverArgs: {}, agentArgs: {}, charts: {}
      },
      {
        id: 'v1.23.0+rke2r1', serverArgs: {}, agentArgs: {}, charts: {}
      }
    ]
  },
  k3sVersions: {
    data: [
      {
        id: 'v1.25.0+k3s1', serverArgs: {}, agentArgs: {}, charts: {}
      },
      {
        id: 'v1.24.0+k3s1', serverArgs: {}, agentArgs: {}, charts: {}
      },
      {
        id: 'v1.23.0+k3s1', serverArgs: {}, agentArgs: {}, charts: {}
      }
    ]
  },
  defaultRke2: 'v1.23.0+rke2r1',
  defaultK3s:  'v1.23.0+k3s1'
};

const defaultGetters = {
  currentStore:           () => 'current_store',
  'management/schemaFor': jest.fn(),
  'current_store/all':    jest.fn(),
  'i18n/t':               jest.fn(),
  'i18n/withFallback':    jest.fn(),
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
    const wrapper = mount(Basics, {
      propsData: {
        mode:  'create',
        value: {
          spec: {
            ...defaultSpec,
            defaultPodSecurityAdmissionConfigurationTemplateName: label,
            kubernetesVersion:                                    k8s
          }
        },
        provider:              'whatever',
        versionsInfo:          versionsInfoMock,
        versionInfo:           {},
        harvesterVersionRange: {},
        userChartValues:       {},
        cisOverride:           false,
        cisPsaChangeBanner:    true
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
    const wrapper = mount(Basics, {
      propsData: {
        mode:  'create',
        value: {
          spec: {
            ...defaultSpec,
            defaultPodSecurityAdmissionConfigurationTemplateName: label,
            kubernetesVersion:                                    k8s
          }
        },
        provider:              'whatever',
        versionsInfo:          versionsInfoMock,
        versionInfo:           {},
        harvesterVersionRange: {},
        userChartValues:       {},
        cisOverride:           true,
        cisPsaChangeBanner:    true
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
    const wrapper = mount(Basics, {
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
        provider:              'custom',
        versionsInfo:          versionsInfoMock,
        versionInfo:           {},
        harvesterVersionRange: {},
        userChartValues:       {},
        cisOverride:           override,
        cisPsaChangeBanner:    true
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

    const select = wrapper.find('[data-testid="rke2-custom-edit-psa"]');

    expect((select.vm as unknown as any).disabled).toBe(disabled);
  });
});
