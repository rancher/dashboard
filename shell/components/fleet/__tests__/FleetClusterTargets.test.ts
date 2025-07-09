import { mount } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import FleetClusterTargets from '@shell/components/fleet/FleetClusterTargets/index.vue';
import { _CREATE, _EDIT } from '@shell/config/query-params';
import { Selector } from '@shell/types/fleet';

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
});
