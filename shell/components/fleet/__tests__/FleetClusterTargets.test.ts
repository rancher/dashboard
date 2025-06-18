import { mount } from '@vue/test-utils';
import FleetClusterTargets from '@shell/components/fleet/FleetClusterTargets/index.vue';
import { _CREATE } from '@shell/config/query-params';
import { Selector } from '@shell/types/fleet';

describe('component: FleetClusterTargets', () => {
  describe('mode: create', () => {
    const mode = _CREATE;

    describe('targets', () => {
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
          },
        });

        const targetMode = wrapper.vm.targetMode;
        const selectedClusters = wrapper.vm.selectedClusters;
        const clusterSelectors = wrapper.vm.clusterSelectors as Selector[];

        expect(targetMode).toBe('all'); // getTargetMode is not called
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
  });
});
