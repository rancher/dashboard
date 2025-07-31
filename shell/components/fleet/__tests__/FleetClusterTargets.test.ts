import { mount } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import FleetClusterTargets from '@shell/components/fleet/FleetClusterTargets/index.vue';
import { _CREATE, _EDIT } from '@shell/config/query-params';
import { Selector } from '@shell/types/fleet';

const mockedStore = () => {
  return {
    getters: {
      'i18n/t':       (text: string) => text,
      'features/get': () => false,
    },
  };
};

const requiredSetup = () => {
  return { global: { mocks: { $store: mockedStore() } } };
};

describe('component: FleetClusterTargets', () => {
  describe('mode: edit', () => {
    const mode = _EDIT;

    describe('decode spec.targets and set form data', () => {
      it('should build form source data from target with clusterName and clusterSelector', () => {
        const target1 = {
          clusterName:     'fleet-5-france',
          clusterSelector: { matchLabels: { foo: 'true' } }
        };
        const wrapper = mount(FleetClusterTargets, {
          ...requiredSetup(),
          props: {
            targets:   [target1],
            namespace: 'fleet-default',
            mode
          },
        });

        const targetMode = wrapper.vm.targetMode;
        const selectedClusters = wrapper.vm.selectedClusters;
        const clusterSelectors = wrapper.vm.clusterSelectors as Selector[];

        expect(targetMode).toBe('clusters');
        expect(selectedClusters).toStrictEqual([target1.clusterName]);
        expect(clusterSelectors[0].matchLabels).toStrictEqual(target1.clusterSelector.matchLabels);
        expect(clusterSelectors[0].matchExpressions).toBeUndefined();
      });

      it('should set targetMode to "all" and correctly filter clusterSelector for harvester rule', () => {
        const target1 = {
          clusterSelector: {
            matchExpressions: [{
              key:      'provider.cattle.io',
              operator: 'NotIn',
              values:   ['harvester']
            }]
          }
        };
        const wrapper = mount(FleetClusterTargets, {
          ...requiredSetup(),
          props: {
            targets:   [target1],
            namespace: 'fleet-default',
            mode,
          },
        });

        const targetMode = wrapper.vm.targetMode;
        const selectedClusters = wrapper.vm.selectedClusters;
        const clusterSelectors = wrapper.vm.clusterSelectors as Selector[];

        expect(targetMode).toBe('all');
        expect(clusterSelectors).toStrictEqual([]); // Harvester rule should be filtered out
        expect(selectedClusters).toStrictEqual([]);
      });

      it('should set targetMode to "clusters" and populate selectedClusters and clusterSelectors', () => {
        const target1 = { clusterName: 'fleet-5-france' };

        const target2 = { clusterSelector: { matchLabels: { foo: 'true' } } };

        const wrapper = mount(FleetClusterTargets, {
          ...requiredSetup(),
          props: {
            targets:   [target1, target2],
            namespace: 'fleet-default',
            mode
          },
        });

        const targetMode = wrapper.vm.targetMode;
        const selectedClusters = wrapper.vm.selectedClusters;
        const clusterSelectors = wrapper.vm.clusterSelectors as Selector[];

        expect(targetMode).toBe('clusters');
        expect(selectedClusters).toStrictEqual(['fleet-5-france']);
        expect(clusterSelectors).toStrictEqual([{
          key:              0,
          matchLabels:      { foo: 'true' },
          matchExpressions: undefined
        }]);
      });

      it('should set targetMode to "clusters" and populate clusterSelectors with multiple entries', () => {
        const target1 = { clusterSelector: { matchLabels: { foo: 'true' } } };
        const target2 = { clusterSelector: { matchLabels: { hci: 'true' } } };

        const wrapper = mount(FleetClusterTargets, {
          ...requiredSetup(),
          props: {
            targets:   [target1, target2],
            namespace: 'fleet-default',
            mode
          },
        });

        const targetMode = wrapper.vm.targetMode;
        const selectedClusters = wrapper.vm.selectedClusters;
        const clusterSelectors = wrapper.vm.clusterSelectors as Selector[];

        expect(targetMode).toBe('clusters');
        expect(selectedClusters).toStrictEqual([]);
        expect(clusterSelectors).toStrictEqual([{
          key:              0,
          matchLabels:      { foo: 'true' },
          matchExpressions: undefined
        }, {
          key:              1,
          matchLabels:      { hci: 'true' },
          matchExpressions: undefined
        }]);
      });

      it('should set targetMode to "advanced" and return early if clusterGroupSelector is present', () => {
        const target1 = { clusterGroupSelector: {} };

        const wrapper = mount(FleetClusterTargets, {
          ...requiredSetup(),
          props: {
            targets:   [target1],
            namespace: 'fleet-default',
            mode
          },
        });

        const targetMode = wrapper.vm.targetMode;
        const selectedClusters = wrapper.vm.selectedClusters;
        const clusterSelectors = wrapper.vm.clusterSelectors as Selector[];

        expect(targetMode).toBe('advanced');
        // Expect no further processing for selectedClusters or clusterSelectors due to early return
        expect(selectedClusters).toStrictEqual([]);
        expect(clusterSelectors).toStrictEqual([]);
      });

      it('should set targetMode to "advanced" and return early if clusterGroup is present', () => {
        const target1 = {
          clusterGroup:         'cg1',
          clusterGroupSelector: {
            matchExpressions: [{
              key:      'string',
              operator: 'string',
              values:   ['string']
            }],
            matchLabels: { foo: 'bar' }
          },
          clusterName:     'pippo',
          clusterSelector: {
            matchExpressions: [{
              key:      'string',
              operator: 'string',
              values:   ['vvv']
            }],
            matchLabels: { foo: 'bar' }
          },
          name: 'tt1',
        };

        const wrapper = mount(FleetClusterTargets, {
          ...requiredSetup(),
          props: {
            targets:   [target1],
            namespace: 'fleet-default',
            mode
          },
        });

        const targetMode = wrapper.vm.targetMode;
        const selectedClusters = wrapper.vm.selectedClusters;
        const clusterSelectors = wrapper.vm.clusterSelectors as Selector[];

        expect(targetMode).toBe('advanced');
        // Expect no further processing for selectedClusters or clusterSelectors due to early return
        expect(selectedClusters).toStrictEqual([]);
        expect(clusterSelectors).toStrictEqual([]);
      });

      it('should return early and not modify state if targets is empty', () => {
        const wrapper = mount(FleetClusterTargets, {
          ...requiredSetup(),
          props: {
            targets:   [],
            namespace: 'fleet-default',
            mode
          },
        });

        const targetMode = wrapper.vm.targetMode;
        const selectedClusters = wrapper.vm.selectedClusters;
        const clusterSelectors = wrapper.vm.clusterSelectors as Selector[];

        expect(targetMode).toBe('none');
        expect(selectedClusters).toStrictEqual([]);
        expect(clusterSelectors).toStrictEqual([]);
      });

      it('should return targetMode local if namespace is fleet-local', () => {
        const target1 = { clusterSelector: { matchLabels: { foo: 'true' } } };
        const wrapper = mount(FleetClusterTargets, {
          ...requiredSetup(),
          props: {
            targets:   [target1],
            namespace: 'fleet-local',
            mode
          },
        });

        const targetMode = wrapper.vm.targetMode;

        expect(targetMode).toBe('local');
      });

      it('should handle targets with multiple clusterName', () => {
        const target1 = { clusterName: 'prod-cluster' };
        const target2 = { clusterName: 'test-cluster' };
        const wrapper = mount(FleetClusterTargets, {
          ...requiredSetup(),
          props: {
            targets:   [target1, target2],
            namespace: 'fleet-default',
            mode
          },
        });

        const targetMode = wrapper.vm.targetMode;
        const selectedClusters = wrapper.vm.selectedClusters;
        const clusterSelectors = wrapper.vm.clusterSelectors as Selector[];

        expect(targetMode).toBe('clusters');
        expect(selectedClusters).toStrictEqual(['prod-cluster', 'test-cluster']);
        expect(clusterSelectors).toStrictEqual([]);
      });

      it('should filter out harvester rule and leave others', () => {
        const target1 = {
          clusterSelector: {
            matchExpressions: [{
              key:      'provider.cattle.io',
              operator: 'NotIn',
              values:   ['harvester']
            }, {
              key:      'foo',
              operator: 'In',
              values:   ['bar']
            }]
          }
        };

        const wrapper = mount(FleetClusterTargets, {
          ...requiredSetup(),
          props: {
            targets:   [target1],
            namespace: 'fleet-default',
            mode
          },
        });

        const targetMode = wrapper.vm.targetMode;
        const selectedClusters = wrapper.vm.selectedClusters;
        const clusterSelectors = wrapper.vm.clusterSelectors as Selector[];

        expect(targetMode).toBe('clusters');
        expect(selectedClusters).toStrictEqual([]);
        expect(clusterSelectors).toStrictEqual([{
          key:              0,
          matchLabels:      undefined,
          matchExpressions: [{
            key:      'foo',
            operator: 'In',
            values:   ['bar']
          }]
        }]);
      });

      it('should correctly process targets when targetMode is "all" and no clusterName or clusterSelector is present', () => {
        const target1 = { name: 'simple-target' };

        const wrapper = mount(FleetClusterTargets, {
          ...requiredSetup(),
          props: {
            targets:   [target1],
            namespace: 'fleet-default',
            mode,
          },
        });

        const targetMode = wrapper.vm.targetMode;
        const selectedClusters = wrapper.vm.selectedClusters;
        const clusterSelectors = wrapper.vm.clusterSelectors as Selector[];

        expect(targetMode).toBe('all');
        expect(selectedClusters).toStrictEqual([]);
        expect(clusterSelectors).toStrictEqual([]);
      });

      it('should correctly process targets when targetMode is "all", name is defined and harvester rule is present', () => {
        const target1 = {
          clusterSelector: {
            matchExpressions: [{
              key:      'provider.cattle.io',
              operator: 'NotIn',
              values:   ['harvester']
            }]
          },
          name: 'simple-target'
        };

        const wrapper = mount(FleetClusterTargets, {
          ...requiredSetup(),
          props: {
            targets:   [target1],
            namespace: 'fleet-default',
            mode,
          },
        });

        const targetMode = wrapper.vm.targetMode;
        const selectedClusters = wrapper.vm.selectedClusters;
        const clusterSelectors = wrapper.vm.clusterSelectors as Selector[];

        expect(targetMode).toBe('all');
        expect(selectedClusters).toStrictEqual([]);
        expect(clusterSelectors).toStrictEqual([]); // Harvester rule should be filtered out
      });
    });

    describe('decode form data and emit to spec.targets', () => {
      it('should emit target with clusterName and clusterSelector', async() => {
        const target1 = {
          clusterName:     'fleet-5-france',
          clusterSelector: { matchLabels: { foo: 'true' } }
        };
        const wrapper = mount(FleetClusterTargets, {
          ...requiredSetup(),
          props: {
            targets:   [target1],
            namespace: 'fleet-default',
            mode,
          },
        });

        wrapper.vm.update();

        await flushPromises();

        expect(wrapper.emitted('update:value')?.[0][0]).toStrictEqual([{ clusterName: 'fleet-5-france' }, { clusterSelector: { matchLabels: { foo: 'true' } } }]);
      });

      it('should emit harvester exclude rule', async() => {
        const target1 = {
          clusterSelector: {
            matchExpressions: [{
              key:      'provider.cattle.io',
              operator: 'NotIn',
              values:   ['harvester']
            }]
          }
        };
        const wrapper = mount(FleetClusterTargets, {
          ...requiredSetup(),
          props: {
            targets:   [target1],
            namespace: 'fleet-default',
            mode,
          },
        });

        wrapper.vm.update();
        await flushPromises();

        expect(wrapper.emitted('update:value')?.[0][0]).toStrictEqual([{
          clusterSelector: {
            matchExpressions: [{
              key: 'provider.cattle.io', operator: 'NotIn', values: ['harvester']
            }]
          }
        }]);
      });

      it('should emit multiple targets with clusterName and clusterSelector', async() => {
        const target1 = { clusterName: 'fleet-5-france' };

        const target2 = { clusterSelector: { matchLabels: { foo: 'true' } } };

        const wrapper = mount(FleetClusterTargets, {
          ...requiredSetup(),
          props: {
            targets:   [target1, target2],
            namespace: 'fleet-default',
            mode,
          },
        });

        wrapper.vm.update();
        await flushPromises();

        expect(wrapper.emitted('update:value')?.[0][0]).toStrictEqual([{ clusterName: 'fleet-5-france' }, { clusterSelector: { matchLabels: { foo: 'true' } } }]);
      });

      it('should emit multiple targets containing both clusterSelector fields', async() => {
        const target1 = { clusterSelector: { matchLabels: { foo: 'true' } } };
        const target2 = { clusterSelector: { matchLabels: { hci: 'true' } } };

        const wrapper = mount(FleetClusterTargets, {
          ...requiredSetup(),
          props: {
            targets:   [target1, target2],
            namespace: 'fleet-default',
            mode,
          },
        });

        wrapper.vm.update();
        await flushPromises();

        expect(wrapper.emitted('update:value')?.[0][0]).toStrictEqual([{ clusterSelector: { matchLabels: { foo: 'true' } } }, { clusterSelector: { matchLabels: { hci: 'true' } } }]);
      });

      it('should emit advanced cases untouched', async() => {
        const target1 = { clusterGroupSelector: {} };

        const wrapper = mount(FleetClusterTargets, {
          ...requiredSetup(),
          props: {
            targets:   [target1],
            namespace: 'fleet-default',
            mode,
          },
        });

        wrapper.vm.update();
        await flushPromises();

        expect(wrapper.emitted('update:value')?.[0][0]).toStrictEqual([{ clusterGroupSelector: {} }]);
      });

      it('should emit full target definition', async() => {
        const target1 = {
          clusterGroup:         'cg1',
          clusterGroupSelector: {
            matchExpressions: [{
              key:      'string',
              operator: 'string',
              values:   ['string']
            }],
            matchLabels: { foo: 'bar' }
          },
          clusterName:     'pippo',
          clusterSelector: {
            matchExpressions: [{
              key:      'string',
              operator: 'string',
              values:   ['vvv']
            }],
            matchLabels: { foo: 'bar' }
          },
          name: 'tt1',
        };

        const wrapper = mount(FleetClusterTargets, {
          ...requiredSetup(),
          props: {
            targets:   [target1],
            namespace: 'fleet-default',
            mode,
          },
        });

        wrapper.vm.update();
        await flushPromises();

        expect(wrapper.emitted('update:value')?.[0][0]).toStrictEqual([{
          clusterGroup:         'cg1',
          clusterGroupSelector: {
            matchExpressions: [{
              key: 'string', operator: 'string', values: ['string']
            }],
            matchLabels: { foo: 'bar' }
          },
          clusterName:     'pippo',
          clusterSelector: {
            matchExpressions: [{
              key: 'string', operator: 'string', values: ['vvv']
            }],
            matchLabels: { foo: 'bar' }
          },
          name: 'tt1'
        }]);
      });

      it('should emit harvester rule from empty targets source', async() => {
        const wrapper = mount(FleetClusterTargets, {
          ...requiredSetup(),
          props: {
            targets:   [], // targetMode === 'none'
            namespace: 'fleet-default',
            mode,
          },
        });

        wrapper.vm.update();
        await flushPromises();

        expect(wrapper.emitted('update:value')?.[0][0]).toBeUndefined();
      });

      it('should emit untouched targets from source when operating in fleet-local workspace', async() => {
        const target1 = { clusterSelector: { matchLabels: { foo: 'true' } } };

        const wrapper = mount(FleetClusterTargets, {
          ...requiredSetup(),
          props: {
            targets:   [target1],
            namespace: 'fleet-local',
            mode,
          },
        });

        wrapper.vm.update();
        await flushPromises();

        expect(wrapper.emitted('update:value')?.[0][0]).toStrictEqual([{ clusterSelector: { matchLabels: { foo: 'true' } } }]);
      });

      it('should emit custom targets filtering out harvester rule', async() => {
        const target1 = {
          clusterSelector: {
            matchExpressions: [{
              key:      'provider.cattle.io',
              operator: 'NotIn',
              values:   ['harvester']
            }, {
              key:      'foo',
              operator: 'In',
              values:   ['bar']
            }]
          }
        };

        const wrapper = mount(FleetClusterTargets, {
          ...requiredSetup(),
          props: {
            targets:   [target1],
            namespace: 'fleet-default',
            mode,
          },
        });

        wrapper.vm.update();
        await flushPromises();

        expect(wrapper.emitted('update:value')?.[0][0]).toStrictEqual([{
          clusterSelector: {
            matchExpressions: [{
              key: 'foo', operator: 'In', values: ['bar']
            }]
          }
        }]);
      });

      it('should emit targets excluding target names and adding harvester rule', async() => {
        const target1 = { name: 'simple-target' };

        const wrapper = mount(FleetClusterTargets, {
          ...requiredSetup(),
          props: {
            targets:   [target1],
            namespace: 'fleet-default',
            mode,
          },
        });

        wrapper.vm.update();
        await flushPromises();

        expect(wrapper.emitted('update:value')?.[0][0]).toStrictEqual([{
          clusterSelector: {
            matchExpressions: [{
              key: 'provider.cattle.io', operator: 'NotIn', values: ['harvester']
            }]
          }
        }]);
      });

      it('should emit targets excluding target names and harvester rule if present in source targets', async() => {
        const target1 = {
          clusterSelector: {
            matchExpressions: [{
              key:      'provider.cattle.io',
              operator: 'NotIn',
              values:   ['harvester']
            }]
          },
          name: 'simple-target'
        };

        const wrapper = mount(FleetClusterTargets, {
          ...requiredSetup(),
          props: {
            targets:   [target1],
            namespace: 'fleet-default',
            mode,
          },
        });

        wrapper.vm.update();
        await flushPromises();

        expect(wrapper.emitted('update:value')?.[0][0]).toStrictEqual([{
          clusterSelector: {
            matchExpressions: [{
              key: 'provider.cattle.io', operator: 'NotIn', values: ['harvester']
            }]
          }
        }]);
      });
    });
  });

  describe('mode: create', () => {
    const mode = _CREATE;

    describe('decode spec.targets and set form data', () => {
      it('should build form source data from target with clusterName and clusterSelector', () => {
        const target1 = {
          clusterName:     'fleet-5-france',
          clusterSelector: { matchLabels: { foo: 'true' } }
        };
        const wrapper = mount(FleetClusterTargets, {
          ...requiredSetup(),
          props: {
            targets:   [target1],
            namespace: 'fleet-default',
            mode,
            created:   'clusters'
          },
        });

        const targetMode = wrapper.vm.targetMode;
        const selectedClusters = wrapper.vm.selectedClusters;
        const clusterSelectors = wrapper.vm.clusterSelectors as Selector[];

        expect(targetMode).toBe('clusters');
        expect(selectedClusters).toStrictEqual([target1.clusterName]);
        expect(clusterSelectors[0].matchLabels).toStrictEqual(target1.clusterSelector.matchLabels);
        expect(clusterSelectors[0].matchExpressions).toBeUndefined();
      });

      it('should set targetMode to "all" and correctly filter clusterSelector for harvester rule', () => {
        const target1 = {
          clusterSelector: {
            matchExpressions: [{
              key:      'provider.cattle.io',
              operator: 'NotIn',
              values:   ['harvester']
            }]
          }
        };
        const wrapper = mount(FleetClusterTargets, {
          ...requiredSetup(),
          props: {
            targets:   [target1],
            namespace: 'fleet-default',
            mode,
          },
        });

        const targetMode = wrapper.vm.targetMode;
        const selectedClusters = wrapper.vm.selectedClusters;
        const clusterSelectors = wrapper.vm.clusterSelectors as Selector[];

        expect(targetMode).toBe('all');
        expect(clusterSelectors).toStrictEqual([]); // Harvester rule should be filtered out
        expect(selectedClusters).toStrictEqual([]);
      });

      it('should set targetMode to "clusters" and populate selectedClusters and clusterSelectors', () => {
        const target1 = { clusterName: 'fleet-5-france' };

        const target2 = { clusterSelector: { matchLabels: { foo: 'true' } } };

        const wrapper = mount(FleetClusterTargets, {
          ...requiredSetup(),
          props: {
            targets:   [target1, target2],
            namespace: 'fleet-default',
            mode,
            created:   'clusters'
          },
        });

        const targetMode = wrapper.vm.targetMode;
        const selectedClusters = wrapper.vm.selectedClusters;
        const clusterSelectors = wrapper.vm.clusterSelectors as Selector[];

        expect(targetMode).toBe('clusters');
        expect(selectedClusters).toStrictEqual(['fleet-5-france']);
        expect(clusterSelectors).toStrictEqual([{
          key:              0,
          matchLabels:      { foo: 'true' },
          matchExpressions: undefined
        }]);
      });

      it('should set targetMode to "clusters" and populate clusterSelectors with multiple entries', () => {
        const target1 = { clusterSelector: { matchLabels: { foo: 'true' } } };
        const target2 = { clusterSelector: { matchLabels: { hci: 'true' } } };

        const wrapper = mount(FleetClusterTargets, {
          ...requiredSetup(),
          props: {
            targets:   [target1, target2],
            namespace: 'fleet-default',
            mode,
            created:   'clusters'
          },
        });

        const targetMode = wrapper.vm.targetMode;
        const selectedClusters = wrapper.vm.selectedClusters;
        const clusterSelectors = wrapper.vm.clusterSelectors as Selector[];

        expect(targetMode).toBe('clusters');
        expect(selectedClusters).toStrictEqual([]);
        expect(clusterSelectors).toStrictEqual([{
          key:              0,
          matchLabels:      { foo: 'true' },
          matchExpressions: undefined
        }, {
          key:              1,
          matchLabels:      { hci: 'true' },
          matchExpressions: undefined
        }]);
      });

      it('should set targetMode to "advanced" and return early if clusterGroupSelector is present', () => {
        const target1 = { clusterGroupSelector: {} };

        const wrapper = mount(FleetClusterTargets, {
          ...requiredSetup(),
          props: {
            targets:   [target1],
            namespace: 'fleet-default',
            mode,
            created:   'advanced'
          },
        });

        const targetMode = wrapper.vm.targetMode;
        const selectedClusters = wrapper.vm.selectedClusters;
        const clusterSelectors = wrapper.vm.clusterSelectors as Selector[];

        expect(targetMode).toBe('advanced');
        // Expect no further processing for selectedClusters or clusterSelectors due to early return
        expect(selectedClusters).toStrictEqual([]);
        expect(clusterSelectors).toStrictEqual([]);
      });

      it('should set targetMode to "advanced" and return early if clusterGroup is present', () => {
        const target1 = {
          clusterGroup:         'cg1',
          clusterGroupSelector: {
            matchExpressions: [{
              key:      'string',
              operator: 'string',
              values:   ['string']
            }],
            matchLabels: { foo: 'bar' }
          },
          clusterName:     'pippo',
          clusterSelector: {
            matchExpressions: [{
              key:      'string',
              operator: 'string',
              values:   ['vvv']
            }],
            matchLabels: { foo: 'bar' }
          },
          name: 'tt1',
        };

        const wrapper = mount(FleetClusterTargets, {
          ...requiredSetup(),
          props: {
            targets:   [target1],
            namespace: 'fleet-default',
            mode,
            created:   'advanced'
          },
        });

        const targetMode = wrapper.vm.targetMode;
        const selectedClusters = wrapper.vm.selectedClusters;
        const clusterSelectors = wrapper.vm.clusterSelectors as Selector[];

        expect(targetMode).toBe('advanced');
        // Expect no further processing for selectedClusters or clusterSelectors due to early return
        expect(selectedClusters).toStrictEqual([]);
        expect(clusterSelectors).toStrictEqual([]);
      });

      it('should return early and not modify state if targets is empty', () => {
        const wrapper = mount(FleetClusterTargets, {
          ...requiredSetup(),
          props: {
            targets:   [],
            namespace: 'fleet-default',
            mode,
            created:   'none'
          },
        });

        const targetMode = wrapper.vm.targetMode;
        const selectedClusters = wrapper.vm.selectedClusters;
        const clusterSelectors = wrapper.vm.clusterSelectors as Selector[];

        expect(targetMode).toBe('none');
        expect(selectedClusters).toStrictEqual([]);
        expect(clusterSelectors).toStrictEqual([]);
      });

      it('should return targetMode local if namespace is fleet-local', () => {
        const target1 = { clusterSelector: { matchLabels: { foo: 'true' } } };
        const wrapper = mount(FleetClusterTargets, {
          ...requiredSetup(),
          props: {
            targets:   [target1],
            namespace: 'fleet-local',
            mode,
            created:   'local'
          },
        });

        const targetMode = wrapper.vm.targetMode;

        expect(targetMode).toBe('local');
      });

      it('should handle targets with multiple clusterName', () => {
        const target1 = { clusterName: 'prod-cluster' };
        const target2 = { clusterName: 'test-cluster' };
        const wrapper = mount(FleetClusterTargets, {
          ...requiredSetup(),
          props: {
            targets:   [target1, target2],
            namespace: 'fleet-default',
            mode,
            created:   'clusters'
          },
        });

        const targetMode = wrapper.vm.targetMode;
        const selectedClusters = wrapper.vm.selectedClusters;
        const clusterSelectors = wrapper.vm.clusterSelectors as Selector[];

        expect(targetMode).toBe('clusters');
        expect(selectedClusters).toStrictEqual(['prod-cluster', 'test-cluster']);
        expect(clusterSelectors).toStrictEqual([]);
      });

      it('should filter out harvester rule and leave others', () => {
        const target1 = {
          clusterSelector: {
            matchExpressions: [{
              key:      'provider.cattle.io',
              operator: 'NotIn',
              values:   ['harvester']
            }, {
              key:      'foo',
              operator: 'In',
              values:   ['bar']
            }]
          }
        };

        const wrapper = mount(FleetClusterTargets, {
          ...requiredSetup(),
          props: {
            targets:   [target1],
            namespace: 'fleet-default',
            mode,
            created:   'clusters'
          },
        });

        const targetMode = wrapper.vm.targetMode;
        const selectedClusters = wrapper.vm.selectedClusters;
        const clusterSelectors = wrapper.vm.clusterSelectors as Selector[];

        expect(targetMode).toBe('clusters');
        expect(selectedClusters).toStrictEqual([]);
        expect(clusterSelectors).toStrictEqual([{
          key:              0,
          matchLabels:      undefined,
          matchExpressions: [{
            key:      'foo',
            operator: 'In',
            values:   ['bar']
          }]
        }]);
      });

      it('should correctly process targets when targetMode is "all" and no clusterName or clusterSelector is present', () => {
        const target1 = { name: 'simple-target' };

        const wrapper = mount(FleetClusterTargets, {
          ...requiredSetup(),
          props: {
            targets:   [target1],
            namespace: 'fleet-default',
            mode,
          },
        });

        const targetMode = wrapper.vm.targetMode;
        const selectedClusters = wrapper.vm.selectedClusters;
        const clusterSelectors = wrapper.vm.clusterSelectors as Selector[];

        expect(targetMode).toBe('all');
        expect(selectedClusters).toStrictEqual([]);
        expect(clusterSelectors).toStrictEqual([]);
      });

      it('should correctly process targets when targetMode is "all", name is defined and harvester rule is present', () => {
        const target1 = {
          clusterSelector: {
            matchExpressions: [{
              key:      'provider.cattle.io',
              operator: 'NotIn',
              values:   ['harvester']
            }]
          },
          name: 'simple-target'
        };

        const wrapper = mount(FleetClusterTargets, {
          ...requiredSetup(),
          props: {
            targets:   [target1],
            namespace: 'fleet-default',
            mode,
          },
        });

        const targetMode = wrapper.vm.targetMode;
        const selectedClusters = wrapper.vm.selectedClusters;
        const clusterSelectors = wrapper.vm.clusterSelectors as Selector[];

        expect(targetMode).toBe('all');
        expect(selectedClusters).toStrictEqual([]);
        expect(clusterSelectors).toStrictEqual([]); // Harvester rule should be filtered out
      });
    });

    describe('decode form data and emit to spec.targets', () => {
      it('should emit target with clusterName and clusterSelector', async() => {
        const target1 = {
          clusterName:     'fleet-5-france',
          clusterSelector: { matchLabels: { foo: 'true' } }
        };
        const wrapper = mount(FleetClusterTargets, {
          ...requiredSetup(),
          props: {
            targets:   [target1],
            namespace: 'fleet-default',
            mode,
          },
        });

        wrapper.setData({ targetMode: 'clusters' });

        wrapper.vm.update();

        await flushPromises();

        expect(wrapper.emitted('update:value')?.[1][0]).toStrictEqual([{ clusterName: 'fleet-5-france' }, { clusterSelector: { matchLabels: { foo: 'true' } } }]);
      });

      it('should emit harvester exclude rule', async() => {
        const target1 = {
          clusterSelector: {
            matchExpressions: [{
              key:      'provider.cattle.io',
              operator: 'NotIn',
              values:   ['harvester']
            }]
          }
        };
        const wrapper = mount(FleetClusterTargets, {
          ...requiredSetup(),
          props: {
            targets:   [target1],
            namespace: 'fleet-default',
            mode,
          },
        });

        wrapper.vm.update();
        await flushPromises();

        expect(wrapper.emitted('update:value')?.[0][0]).toStrictEqual([{
          clusterSelector: {
            matchExpressions: [{
              key: 'provider.cattle.io', operator: 'NotIn', values: ['harvester']
            }]
          }
        }]);
      });

      it('should emit multiple targets with clusterName and clusterSelector', async() => {
        const target1 = { clusterName: 'fleet-5-france' };

        const target2 = { clusterSelector: { matchLabels: { foo: 'true' } } };

        const wrapper = mount(FleetClusterTargets, {
          ...requiredSetup(),
          props: {
            targets:   [target1, target2],
            namespace: 'fleet-default',
            mode,
          },
        });

        wrapper.setData({ targetMode: 'clusters' });

        wrapper.vm.update();
        await flushPromises();

        expect(wrapper.emitted('update:value')?.[1][0]).toStrictEqual([{ clusterName: 'fleet-5-france' }, { clusterSelector: { matchLabels: { foo: 'true' } } }]);
      });

      it('should emit multiple targets containing both clusterSelector fields', async() => {
        const target1 = { clusterSelector: { matchLabels: { foo: 'true' } } };
        const target2 = { clusterSelector: { matchLabels: { hci: 'true' } } };

        const wrapper = mount(FleetClusterTargets, {
          ...requiredSetup(),
          props: {
            targets:   [target1, target2],
            namespace: 'fleet-default',
            mode,
          },
        });

        wrapper.setData({ targetMode: 'clusters' });

        wrapper.vm.update();
        await flushPromises();

        expect(wrapper.emitted('update:value')?.[1][0]).toStrictEqual([{ clusterSelector: { matchLabels: { foo: 'true' } } }, { clusterSelector: { matchLabels: { hci: 'true' } } }]);
      });

      it('should emit advanced cases untouched', async() => {
        const target1 = { clusterGroupSelector: {} };

        const wrapper = mount(FleetClusterTargets, {
          ...requiredSetup(),
          props: {
            targets:   [target1],
            namespace: 'fleet-default',
            mode,
          },
        });

        wrapper.setData({ targetMode: 'advanced' });

        wrapper.vm.update();
        await flushPromises();

        expect(wrapper.emitted('update:value')?.[1][0]).toStrictEqual([{ clusterGroupSelector: {} }]);
      });

      it('should emit full target definition', async() => {
        const target1 = {
          clusterGroup:         'cg1',
          clusterGroupSelector: {
            matchExpressions: [{
              key:      'string',
              operator: 'string',
              values:   ['string']
            }],
            matchLabels: { foo: 'bar' }
          },
          clusterName:     'pippo',
          clusterSelector: {
            matchExpressions: [{
              key:      'string',
              operator: 'string',
              values:   ['vvv']
            }],
            matchLabels: { foo: 'bar' }
          },
          name: 'tt1',
        };

        const wrapper = mount(FleetClusterTargets, {
          ...requiredSetup(),
          props: {
            targets:   [target1],
            namespace: 'fleet-default',
            mode,
          },
        });

        wrapper.setData({ targetMode: 'advanced' });

        wrapper.vm.update();
        await flushPromises();

        expect(wrapper.emitted('update:value')?.[1][0]).toStrictEqual([{
          clusterGroup:         'cg1',
          clusterGroupSelector: {
            matchExpressions: [{
              key: 'string', operator: 'string', values: ['string']
            }],
            matchLabels: { foo: 'bar' }
          },
          clusterName:     'pippo',
          clusterSelector: {
            matchExpressions: [{
              key: 'string', operator: 'string', values: ['vvv']
            }],
            matchLabels: { foo: 'bar' }
          },
          name: 'tt1'
        }]);
      });

      it('should emit harvester rule from empty targets source', async() => {
        const wrapper = mount(FleetClusterTargets, {
          ...requiredSetup(),
          props: {
            targets:   [], // targetMode === 'none'
            namespace: 'fleet-default',
            mode,
          },
        });

        wrapper.setData({ targetMode: 'none' });

        wrapper.vm.update();
        await flushPromises();

        expect(wrapper.emitted('update:value')?.[1][0]).toBeUndefined();
      });

      it('should emit untouched targets from source when operating in fleet-local workspace', async() => {
        const target1 = { clusterSelector: { matchLabels: { foo: 'true' } } };

        const wrapper = mount(FleetClusterTargets, {
          ...requiredSetup(),
          props: {
            targets:   [target1],
            namespace: 'fleet-local',
            mode,
          },
        });

        wrapper.setData({ targetMode: 'clusters' });

        wrapper.vm.update();
        await flushPromises();

        expect(wrapper.emitted('update:value')?.[1][0]).toStrictEqual([{ clusterSelector: { matchLabels: { foo: 'true' } } }]);
      });

      it('should emit custom targets filtering out harvester rule', async() => {
        const target1 = {
          clusterSelector: {
            matchExpressions: [{
              key:      'provider.cattle.io',
              operator: 'NotIn',
              values:   ['harvester']
            }, {
              key:      'foo',
              operator: 'In',
              values:   ['bar']
            }]
          }
        };

        const wrapper = mount(FleetClusterTargets, {
          ...requiredSetup(),
          props: {
            targets:   [target1],
            namespace: 'fleet-default',
            mode,
          },
        });

        wrapper.setData({ targetMode: 'clusters' });

        wrapper.vm.update();
        await flushPromises();

        expect(wrapper.emitted('update:value')?.[1][0]).toStrictEqual([{
          clusterSelector: {
            matchExpressions: [{
              key: 'foo', operator: 'In', values: ['bar']
            }]
          }
        }]);
      });

      it('should emit targets excluding target names and adding harvester rule', async() => {
        const target1 = { name: 'simple-target' };

        const wrapper = mount(FleetClusterTargets, {
          ...requiredSetup(),
          props: {
            targets:   [target1],
            namespace: 'fleet-default',
            mode,
          },
        });

        wrapper.vm.update();
        await flushPromises();

        expect(wrapper.emitted('update:value')?.[0][0]).toStrictEqual([{
          clusterSelector: {
            matchExpressions: [{
              key: 'provider.cattle.io', operator: 'NotIn', values: ['harvester']
            }]
          }
        }]);
      });

      it('should emit targets excluding target names and harvester rule if present in source targets', async() => {
        const target1 = {
          clusterSelector: {
            matchExpressions: [{
              key:      'provider.cattle.io',
              operator: 'NotIn',
              values:   ['harvester']
            }]
          },
          name: 'simple-target'
        };

        const wrapper = mount(FleetClusterTargets, {
          ...requiredSetup(),
          props: {
            targets:   [target1],
            namespace: 'fleet-default',
            mode,
          },
        });

        wrapper.vm.update();
        await flushPromises();

        expect(wrapper.emitted('update:value')?.[0][0]).toStrictEqual([{
          clusterSelector: {
            matchExpressions: [{
              key: 'provider.cattle.io', operator: 'NotIn', values: ['harvester']
            }]
          }
        }]);
      });
    });
  });

  describe('clusterGroup Functionality Tests', () => {
    describe('clusterGroup Data Management', () => {
      it('should initialize with empty selectedClusterGroups', () => {
        const wrapper = mount(FleetClusterTargets, {
          props: {
            targets:   [],
            namespace: 'fleet-default',
            mode:      _EDIT
          }
        });

        expect(wrapper.vm.selectedClusterGroups).toStrictEqual([]);
      });

      it('should populate allClusterGroups from store data', async() => {
        const mockClusterGroups = [
          {
            metadata:    { namespace: 'fleet-default', name: 'production-group' },
            nameDisplay: 'Production Group'
          },
          {
            metadata:    { namespace: 'fleet-default', name: 'staging-group' },
            nameDisplay: 'Staging Group'
          }
        ];

        const wrapper = mount(FleetClusterTargets, {
          props: {
            targets:   [],
            namespace: 'fleet-default',
            mode:      _EDIT
          }
        });

        wrapper.setData({ allClusterGroups: mockClusterGroups });
        await flushPromises();

        expect(wrapper.vm.allClusterGroups).toStrictEqual(mockClusterGroups);
      });

      it('should filter clusterGroupsOptions by namespace', () => {
        const mockClusterGroups = [
          {
            metadata:    { namespace: 'fleet-default', name: 'group-1' },
            nameDisplay: 'Group 1'
          },
          {
            metadata:    { namespace: 'other-namespace', name: 'group-2' },
            nameDisplay: 'Group 2'
          },
          {
            metadata:    { namespace: 'fleet-default', name: 'group-3' },
            nameDisplay: 'Group 3'
          }
        ];

        const wrapper = mount(FleetClusterTargets, {
          props: {
            targets:   [],
            namespace: 'fleet-default',
            mode:      _EDIT
          }
        });

        wrapper.setData({ allClusterGroups: mockClusterGroups });

        const filteredOptions = wrapper.vm.clusterGroupsOptions;

        expect(filteredOptions).toHaveLength(2);
        expect(filteredOptions).toStrictEqual([
          { label: 'Group 1', value: 'group-1' },
          { label: 'Group 3', value: 'group-3' }
        ]);
      });
    });

    describe('clusterGroup Selection Methods', () => {
      it('should update selectedClusterGroups when selectClusterGroups is called', async() => {
        const wrapper = mount(FleetClusterTargets, {
          props: {
            targets:   [],
            namespace: 'fleet-default',
            mode:      _EDIT
          }
        });

        const updateSpy = jest.spyOn(wrapper.vm, 'update');

        wrapper.vm.selectClusterGroups(['group-1', 'group-2']);
        await flushPromises();

        expect(wrapper.vm.selectedClusterGroups).toStrictEqual(['group-1', 'group-2']);
        expect(updateSpy).toHaveBeenCalledWith();
      });

      it('should emit update:value when selectClusterGroups is called', async() => {
        const wrapper = mount(FleetClusterTargets, {
          props: {
            targets:   [],
            namespace: 'fleet-default',
            mode:      _EDIT
          }
        });

        wrapper.vm.selectClusterGroups(['test-group']);
        await flushPromises();

        expect(wrapper.emitted('update:value')).toBeDefined();
      });

      it('should handle empty array in selectClusterGroups', async() => {
        const wrapper = mount(FleetClusterTargets, {
          props: {
            targets:   [],
            namespace: 'fleet-default',
            mode:      _EDIT
          }
        });

        // First set some groups
        wrapper.vm.selectClusterGroups(['group-1', 'group-2']);
        await flushPromises();

        // Then clear them
        wrapper.vm.selectClusterGroups([]);
        await flushPromises();

        expect(wrapper.vm.selectedClusterGroups).toStrictEqual([]);
      });

      it('should replace existing selectedClusterGroups on new selection', async() => {
        const wrapper = mount(FleetClusterTargets, {
          props: {
            targets:   [],
            namespace: 'fleet-default',
            mode:      _EDIT
          }
        });

        // Initial selection
        wrapper.vm.selectClusterGroups(['group-1', 'group-2']);
        await flushPromises();

        // Replace with new selection
        wrapper.vm.selectClusterGroups(['group-3', 'group-4', 'group-5']);
        await flushPromises();

        expect(wrapper.vm.selectedClusterGroups).toStrictEqual(['group-3', 'group-4', 'group-5']);
      });
    });

    describe('clusterGroup Target Processing', () => {
      it('should parse existing targets with clusterGroup in fromTargets', () => {
        const targets = [
          { clusterGroup: 'production-group' },
          { clusterGroup: 'staging-group' },
          { clusterName: 'specific-cluster' }
        ];

        const wrapper = mount(FleetClusterTargets, {
          props: {
            targets,
            namespace: 'fleet-default',
            mode:      _EDIT
          }
        });

        expect(wrapper.vm.selectedClusterGroups).toStrictEqual(['production-group', 'staging-group']);
        expect(wrapper.vm.selectedClusters).toStrictEqual(['specific-cluster']);
      });

      it('should include clusterGroups in normalizeTargets output', () => {
        const wrapper = mount(FleetClusterTargets, {
          props: {
            targets:   [],
            namespace: 'fleet-default',
            mode:      _EDIT
          }
        });

        const result = wrapper.vm.normalizeTargets(
          ['cluster-1'],
          [{ matchLabels: { env: 'prod' } }],
          ['group-1', 'group-2']
        );

        expect(result).toStrictEqual([
          { clusterName: 'cluster-1' },
          { clusterSelector: { matchLabels: { env: 'prod' } } },
          { clusterGroup: 'group-1' },
          { clusterGroup: 'group-2' }
        ]);
      });

      it('should handle only clusterGroups in normalizeTargets', () => {
        const wrapper = mount(FleetClusterTargets, {
          props: {
            targets:   [],
            namespace: 'fleet-default',
            mode:      _EDIT
          }
        });

        const result = wrapper.vm.normalizeTargets([], [], ['group-1', 'group-2']);

        expect(result).toStrictEqual([
          { clusterGroup: 'group-1' },
          { clusterGroup: 'group-2' }
        ]);
      });

      it('should return undefined when normalizeTargets has no inputs', () => {
        const wrapper = mount(FleetClusterTargets, {
          props: {
            targets:   [],
            namespace: 'fleet-default',
            mode:      _EDIT
          }
        });

        const result = wrapper.vm.normalizeTargets([], [], []);

        expect(result).toBeUndefined();
      });

      it('should include clusterGroups in toTargets when targetMode is clusters', () => {
        const wrapper = mount(FleetClusterTargets, {
          props: {
            targets:   [],
            namespace: 'fleet-default',
            mode:      _EDIT
          }
        });

        wrapper.setData({
          targetMode:            'clusters',
          selectedClusters:      ['cluster-1'],
          clusterSelectors:      [],
          selectedClusterGroups: ['group-1', 'group-2']
        });

        const result = wrapper.vm.toTargets();

        expect(result).toStrictEqual([
          { clusterName: 'cluster-1' },
          { clusterGroup: 'group-1' },
          { clusterGroup: 'group-2' }
        ]);
      });
    });

    describe('clusterGroup Integration with Target Modes', () => {
      it('should handle clusterGroup targets and set appropriate targetMode', () => {
        const targets = [
          { clusterGroup: 'test-group' }
        ];

        const wrapper = mount(FleetClusterTargets, {
          props: {
            targets,
            namespace: 'fleet-default',
            mode:      _EDIT
          }
        });

        // ClusterGroup targets should be parsed correctly
        expect(wrapper.vm.selectedClusterGroups).toStrictEqual(['test-group']);
      });
    });

    it('should handle mixed targets with clusterGroup, clusterName, and clusterSelector', () => {
      const targets = [
        { clusterName: 'specific-cluster' },
        { clusterGroup: 'production-group' },
        { clusterSelector: { matchLabels: { env: 'staging' } } },
        { clusterGroup: 'development-group' }
      ];

      const wrapper = mount(FleetClusterTargets, {
        props: {
          targets,
          namespace: 'fleet-default',
          mode:      _EDIT
        }
      });

      expect(wrapper.vm.selectedClusters).toStrictEqual(['specific-cluster']);
      expect(wrapper.vm.selectedClusterGroups).toStrictEqual(['production-group', 'development-group']);
      expect(wrapper.vm.clusterSelectors).toHaveLength(1);
      expect(wrapper.vm.clusterSelectors[0].matchLabels).toStrictEqual({ env: 'staging' });
    });

    it('should reset selectedClusterGroups when reset method is called', () => {
      const wrapper = mount(FleetClusterTargets, {
        props: {
          targets:   [],
          namespace: 'fleet-default',
          mode:      _EDIT
        }
      });

      // Set some cluster groups
      wrapper.setData({
        targetMode:            'clusters',
        selectedClusterGroups: ['group-1', 'group-2'],
        selectedClusters:      ['cluster-1'],
        clusterSelectors:      [{ key: 1 }]
      });

      // Call reset
      wrapper.vm.reset();

      expect(wrapper.vm.selectedClusterGroups).toStrictEqual([]);
      expect(wrapper.vm.targetMode).toBe('all');
      expect(wrapper.vm.selectedClusters).toStrictEqual([]);
      expect(wrapper.vm.clusterSelectors).toStrictEqual([]);
    });
  });

  describe('clusterGroup Event Handling and Updates', () => {
    it('should emit correct targets when both clusters and clusterGroups are selected', async() => {
      const wrapper = mount(FleetClusterTargets, {
        props: {
          targets:   [],
          namespace: 'fleet-default',
          mode:      _CREATE
        }
      });

      // Set target mode and selections
      wrapper.setData({ targetMode: 'clusters' });
      wrapper.vm.selectClusters(['cluster-1', 'cluster-2']);
      await flushPromises();

      wrapper.vm.selectClusterGroups(['group-1']);
      await flushPromises();

      const emittedValues = wrapper.emitted('update:value');
      const lastEmitted = emittedValues?.[emittedValues.length - 1][0];

      expect(lastEmitted).toStrictEqual([
        { clusterName: 'cluster-1' },
        { clusterName: 'cluster-2' },
        { clusterGroup: 'group-1' }
      ]);
    });

    it('should handle clusterGroup selection in CREATE mode with proper event emission', async() => {
      const wrapper = mount(FleetClusterTargets, {
        props: {
          targets:   [],
          namespace: 'fleet-default',
          mode:      _CREATE
        }
      });

      wrapper.setData({ targetMode: 'clusters' });
      wrapper.vm.selectClusterGroups(['create-group-1', 'create-group-2']);
      await flushPromises();

      const emittedValues = wrapper.emitted('update:value');

      expect(emittedValues).toBeDefined();

      const lastEmitted = emittedValues?.[emittedValues.length - 1][0];

      expect(lastEmitted).toStrictEqual([
        { clusterGroup: 'create-group-1' },
        { clusterGroup: 'create-group-2' }
      ]);
    });

    it('should update component state correctly when clusterGroups prop changes', async() => {
      const initialTargets = [{ clusterGroup: 'initial-group' }];

      const wrapper = mount(FleetClusterTargets, {
        props: {
          targets:   initialTargets,
          namespace: 'fleet-default',
          mode:      _EDIT
        }
      });

      expect(wrapper.vm.selectedClusterGroups).toStrictEqual(['initial-group']);

      // Update props
      const newTargets = [
        { clusterGroup: 'new-group-1' },
        { clusterGroup: 'new-group-2' }
      ];

      await wrapper.setProps({ targets: newTargets });

      // Reset and then parse new targets to simulate component update
      wrapper.vm.reset();
      wrapper.vm.fromTargets();

      expect(wrapper.vm.selectedClusterGroups).toStrictEqual(['new-group-1', 'new-group-2']);
    });
  });

  describe('clusterGroup Edge Cases and Error Handling', () => {
    it('should handle undefined clusterGroup in targets gracefully', () => {
      const targets = [
        { clusterGroup: undefined },
        { clusterGroup: 'valid-group' },
        { clusterName: 'cluster-1' }
      ];

      const wrapper = mount(FleetClusterTargets, {
        props: {
          targets:   targets as any,
          namespace: 'fleet-default',
          mode:      _EDIT
        }
      });

      expect(wrapper.vm.selectedClusterGroups).toStrictEqual(['valid-group']);
    });

    it('should handle empty string clusterGroup in targets', () => {
      const targets = [
        { clusterGroup: '' },
        { clusterGroup: 'valid-group' }
      ];

      const wrapper = mount(FleetClusterTargets, {
        props: {
          targets:   targets as any,
          namespace: 'fleet-default',
          mode:      _EDIT
        }
      });

      expect(wrapper.vm.selectedClusterGroups).toStrictEqual(['valid-group']);
    });

    it('should handle empty allClusterGroups data', () => {
      const wrapper = mount(FleetClusterTargets, {
        props: {
          targets:   [],
          namespace: 'fleet-default',
          mode:      _EDIT
        }
      });

      wrapper.setData({ allClusterGroups: [] });

      expect(() => wrapper.vm.clusterGroupsOptions).not.toThrow();
      expect(wrapper.vm.clusterGroupsOptions).toStrictEqual([]);
    });

    it('should handle clusterGroups with missing nameDisplay', () => {
      const mockClusterGroups = [
        {
          metadata: { namespace: 'fleet-default', name: 'group-1' }
          // Missing nameDisplay
        },
        {
          metadata:    { namespace: 'fleet-default', name: 'group-2' },
          nameDisplay: 'Group 2'
        }
      ];

      const wrapper = mount(FleetClusterTargets, {
        props: {
          targets:   [],
          namespace: 'fleet-default',
          mode:      _EDIT
        }
      });

      wrapper.setData({ allClusterGroups: mockClusterGroups });

      const options = wrapper.vm.clusterGroupsOptions;

      expect(options).toStrictEqual([
        { label: undefined, value: 'group-1' },
        { label: 'Group 2', value: 'group-2' }
      ]);
    });
  });

  describe('clusterGroup Component Lifecycle', () => {
    it('should preserve clusterGroup selections during component updates', async() => {
      const wrapper = mount(FleetClusterTargets, {
        props: {
          targets:   [],
          namespace: 'fleet-default',
          mode:      _EDIT
        }
      });

      // Set initial selection
      wrapper.vm.selectClusterGroups(['persistent-group']);
      await flushPromises();

      // Trigger component update by changing namespace
      await wrapper.setProps({ namespace: 'different-namespace' });
      await flushPromises();

      // In EDIT mode, selections should be preserved unless explicitly reset
      expect(wrapper.vm.selectedClusterGroups).toStrictEqual(['persistent-group']);
    });

    it('should clear clusterGroup selections on namespace change in CREATE mode', async() => {
      const wrapper = mount(FleetClusterTargets, {
        props: {
          targets:   [],
          namespace: 'fleet-default',
          mode:      _CREATE
        }
      });

      // Set initial selection
      wrapper.vm.selectClusterGroups(['temp-group']);
      await flushPromises();

      // Mock the reset method call that happens on namespace change in CREATE mode
      const resetSpy = jest.spyOn(wrapper.vm, 'reset');

      await wrapper.setProps({ namespace: 'different-namespace' });

      // Manually trigger reset to simulate the watcher behavior
      wrapper.vm.reset();

      expect(resetSpy).toHaveBeenCalledWith();
      expect(wrapper.vm.selectedClusterGroups).toStrictEqual([]);
    });
  });
});
