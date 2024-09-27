import { shallowMount } from '@vue/test-utils';
import Workload from '@shell/edit/workload/index.vue';

jest.mock('@shell/models/secret', () => ({ onmessage: jest.fn() }));

describe('component: Workload', () => {
  it.each([
    [
      `pods \"test\" is forbidden: violates PodSecurity \"restricted:latest\": allowPrivilegeEscalation != false (container \"container-0\" must set securityContext.allowPrivilegeEscalation=false), unrestricted capabilities (container \"container-0\" must set securityContext.capabilities.drop=[\"ALL\"]), runAsNonRoot != true (container \"container-0\" must not set securityContext.runAsNonRoot=false), seccompProfile (pod or container \"container-0\" must set securityContext.seccompProfile.type to \"RuntimeDefault\" or \"Localhost\")`,
      `workload.error, \"test\",\"restricted:latest\"`
    ]
  ])('should map error message into object', (oldMessage, newMessage) => {
    const mockedValidationMixin = {
      methods: {
        fvFormIsValid:           jest.fn(),
        type:                    jest.fn(),
        fvGetAndReportPathRules: jest.fn(),
      },
      computed: { fvUnreportedValidationErrors: jest.fn().mockReturnValue([]) }
    };
    const mockedCREMixin = {};
    const mockedWorkloadMixin = {
      methods: {
        doneRoute:                   jest.fn(),
        workloadSubTypes:            jest.fn(),
        applyHooks:                  jest.fn(),
        save:                        jest.fn(),
        selectType:                  jest.fn(),
        isCronJob:                   jest.fn(),
        spec:                        jest.fn(),
        isReplicable:                jest.fn(),
        isStatefulSet:               jest.fn(),
        headlessServices:            jest.fn(),
        defaultTab:                  jest.fn(),
        allContainers:               jest.fn(),
        isPod:                       jest.fn(),
        tabWeightMap:                jest.fn(),
        podLabels:                   jest.fn(),
        podTemplateSpec:             jest.fn(),
        isLoadingSecondaryResources: jest.fn(),
        allNodes:                    jest.fn(),
        allNodeObjects:              jest.fn(),
        clearPvcFormState:           jest.fn(),
        savePvcHookName:             jest.fn(),
        namespacedConfigMaps:        jest.fn(),
        podAnnotations:              jest.fn(),
        isJob:                       jest.fn(),
        podFsGroup:                  jest.fn(),
        namespacedSecrets:           jest.fn(),
        registerBeforeHook:          jest.fn(),
        pvcs:                        jest.fn(),
        // tabWeightMap:     jest.fn(),
      }
    };

    const MockedWorkload = { ...Workload, mixins: [mockedValidationMixin, mockedCREMixin, mockedWorkloadMixin] };
    const wrapper = shallowMount(MockedWorkload, {
      props: {
        value:         { metadata: {}, spec: { template: {} } },
        params:        {},
        fvFormIsValid: {}
      },

      global: {
        mocks: {
          $route:      { params: {}, query: {} },
          $router:     { applyQuery: jest.fn() },
          $fetchState: { pending: false },
          $store:      {
            getters: {
              'cluster/schemaFor': jest.fn(),
              'type-map/labelFor': jest.fn(),
              'i18n/t':            (text: string, v: {[key:string]: string}) => {
                return `${ text }, ${ Object.values(v || {}) }`;
              },
            },
          },
        },

        stubs: {
          Tab:                 true,
          LabeledInput:        true,
          VolumeClaimTemplate: true,
          Networking:          true,
          Job:                 true,
          NodeScheduling:      true,
          PodAffinity:         true,
          Tolerations:         true,
          Storage:             true,
          Tabbed:              true,
          LabeledSelect:       true,
          NameNsDescription:   true,
          CruResource:         true,
          KeyValue:            true
        },
      },
    });

    const result = (wrapper.vm as any).mapError(oldMessage).message;

    expect(result).toStrictEqual(newMessage);
  });
});
