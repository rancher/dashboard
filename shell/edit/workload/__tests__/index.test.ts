import { shallowMount } from '@vue/test-utils';
import Workload from '@shell/edit/workload/index.vue';

jest.mock('@shell/models/secret', () => ({ onmessage: jest.fn() }));

describe('component: Workload', () => {
  const baseMockedValidationMixin = {
    methods: {
      fvFormIsValid:           jest.fn(),
      type:                    jest.fn(),
      fvGetAndReportPathRules: jest.fn(),
    },
    computed: { fvUnreportedValidationErrors: jest.fn().mockReturnValue([]) }
  };
  const baseMockedCREMixin = {};
  const baseMockedWorkloadMixin = {
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
      isPod:                       jest.fn(),
      tabWeightMap:                jest.fn(),
      podLabels:                   jest.fn(),
      podTemplateSpec:             jest.fn(),
      isLoadingSecondaryResources: jest.fn(),
      allNodes:                    jest.fn(),
      clearPvcFormState:           jest.fn(),
      savePvcHookName:             jest.fn(),
      namespacedConfigMaps:        jest.fn(),
      podAnnotations:              jest.fn(),
      isJob:                       jest.fn(),
      namespacedSecrets:           jest.fn(),
      registerBeforeHook:          jest.fn(),
      pvcs:                        jest.fn(),
    },
    computed: { allContainers: jest.fn(() => []) }
  };

  describe('component: Workload', () => {
    it.each([
      [
        `pods \"test\" is forbidden: violates PodSecurity \"restricted:latest\": allowPrivilegeEscalation != false (container \"container-0\" must set securityContext.allowPrivilegeEscalation=false), unrestricted capabilities (container \"container-0\" must set securityContext.capabilities.drop=[\"ALL\"]), runAsNonRoot != true (container \"container-0\" must not set securityContext.runAsNonRoot=false), seccompProfile (pod or container \"container-0\" must set securityContext.seccompProfile.type to \"RuntimeDefault\" or \"Localhost\")`,
        `workload.error, \"test\",\"restricted:latest\"`
      ]
    ])('should map error message into object', (oldMessage, newMessage) => {
    // For this test, allNodeObjects is just a jest.fn() in the base mixin
      const MockedWorkload = { ...Workload, mixins: [baseMockedValidationMixin, baseMockedCREMixin, { ...baseMockedWorkloadMixin, computed: { ...baseMockedWorkloadMixin.computed, allNodeObjects: jest.fn() } }] };
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

    describe('secondaryResourceDataConfig', () => {
      it('should filter out nodes with control-plane or etcd taints from workerNodes parsingFunc', () => {
        const allNodeObjects = [
          {
            id:   'node-1',
            spec: { taints: [{ key: 'node-role.kubernetes.io/control-plane', effect: 'NoSchedule' }] }
          },
          {
            id:   'node-2',
            spec: { taints: [{ key: 'node-role.kubernetes.io/etcd', effect: 'NoSchedule' }] }
          },
          {
            id:   'node-3',
            spec: { taints: [{ key: 'node-role.kubernetes.io/worker', effect: 'NoSchedule' }] }
          },
          {
            id:   'node-4',
            spec: { taints: [] }
          },
          {
            id:   'node-5',
            spec: {}
          },
          {
            id:   'node-6',
            spec: null
          }
        ];

        const { data } = (Workload.mixins[2] as any).methods.secondaryResourceDataConfig.apply({ value: { metadata: { namespace: 'test' } } });
        const workerNodesParsingFunc = data.node.applyTo.find((r: any) => r.var === 'workerNodes').parsingFunc;
        const result = workerNodesParsingFunc(allNodeObjects);

        expect(result).toStrictEqual(['node-3', 'node-4', 'node-5', 'node-6']);
      });
    });
  });
});
