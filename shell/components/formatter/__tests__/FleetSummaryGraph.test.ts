import { shallowMount } from '@vue/test-utils';
import FleetSummaryGraph from '@shell/components/formatter/FleetSummaryGraph.vue';
import { FLEET } from '@shell/config/types';
import { ExtendedVue, Vue } from 'vue/types/vue';
import { DefaultProps } from 'vue/types/options';

const FleetSummaryGraphComponent = FleetSummaryGraph as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>;

function makeRow({
  type = FLEET.GIT_REPO,
  resourceCounts = {},
  targetClusters = [],
  statusResourceCountsForCluster = undefined,
}: {
  type?: string;
  resourceCounts?: Record<string, number>;
  targetClusters?: any[];
  statusResourceCountsForCluster?: any;
} = {}) {
  const row: Record<string, any> = {
    id:     'test-ns/test-row',
    type,
    status: { resourceCounts },
    targetClusters,
  };

  if (statusResourceCountsForCluster !== undefined) {
    row.statusResourceCountsForCluster = statusResourceCountsForCluster;
  }

  return row;
}

describe('component: FleetSummaryGraph', () => {
  describe('summary', () => {
    it('returns status.resourceCounts for GitRepo rows', () => {
      const resourceCounts = {
        desiredReady: 7,
        ready:        7,
      };
      const wrapper = shallowMount(FleetSummaryGraphComponent, {
        propsData: {
          row: makeRow({
            resourceCounts,
            targetClusters: [{ id: 'cluster-1' }],
          }),
        },
      });

      expect((wrapper.vm as any).summary).toStrictEqual(resourceCounts);
    });

    it('returns status.resourceCounts for HelmOp rows', () => {
      const resourceCounts = {
        desiredReady: 3,
        ready:        2,
        modified:     1,
      };
      const wrapper = shallowMount(FleetSummaryGraphComponent, {
        propsData: {
          row: makeRow({
            type:           FLEET.HELM_OP,
            resourceCounts,
            targetClusters: [{ id: 'cluster-1' }],
          }),
        },
      });

      expect((wrapper.vm as any).summary).toStrictEqual(resourceCounts);
    });

    it('does not return function when row has statusResourceCountsForCluster as a method', () => {
      const resourceCounts = {
        desiredReady: 5,
        ready:        5,
      };
      const wrapper = shallowMount(FleetSummaryGraphComponent, {
        propsData: {
          row: makeRow({
            resourceCounts,
            targetClusters:                 [{ id: 'cluster-1' }],
            // Simulate a class method — the bug was that a truthy function
            // caused summary to return the function itself instead of resourceCounts
            statusResourceCountsForCluster: (clusterId: string) => ({ desiredReady: 0 }),
          }),
        },
      });

      const summary = (wrapper.vm as any).summary;

      expect(typeof summary).not.toBe('function');
      expect(summary).toStrictEqual(resourceCounts);
    });

    it('calls statusResourceCountsForCluster with clusterId when clusterId prop is set', () => {
      const perClusterData = {
        desiredReady: 2,
        ready:        1,
      };
      const mockFn = jest.fn().mockReturnValue(perClusterData);

      const wrapper = shallowMount(FleetSummaryGraphComponent, {
        propsData: {
          row:       makeRow({ statusResourceCountsForCluster: mockFn }),
          clusterId: 'cluster-1',
        },
      });

      expect((wrapper.vm as any).summary).toStrictEqual(perClusterData);
      expect(mockFn).toHaveBeenCalledWith('cluster-1');
    });

    it('returns empty object when status.resourceCounts is undefined', () => {
      const wrapper = shallowMount(FleetSummaryGraphComponent, { propsData: { row: makeRow() } });

      expect((wrapper.vm as any).summary).toStrictEqual({});
    });
  });

  describe('show', () => {
    it('returns true when stateParts exist and row has targetClusters', () => {
      const wrapper = shallowMount(FleetSummaryGraphComponent, {
        propsData: {
          row: makeRow({
            resourceCounts: {
              desiredReady: 5,
              ready:        5,
            },
            targetClusters: [{ id: 'cluster-1' }],
          }),
        },
      });

      expect((wrapper.vm as any).show).toBeTruthy();
    });

    it('returns false when stateParts exist but targetClusters is empty', () => {
      const wrapper = shallowMount(FleetSummaryGraphComponent, {
        propsData: {
          row: makeRow({
            resourceCounts: {
              desiredReady: 5,
              ready:        5,
            },
            targetClusters: [],
          }),
        },
      });

      expect((wrapper.vm as any).show).toBeFalsy();
    });

    it('returns true for FLEET.CLUSTER type even without targetClusters', () => {
      const wrapper = shallowMount(FleetSummaryGraphComponent, {
        propsData: {
          row: makeRow({
            type:           FLEET.CLUSTER,
            resourceCounts: {
              desiredReady: 3,
              ready:        3,
            },
          }),
        },
      });

      expect((wrapper.vm as any).show).toBeTruthy();
    });

    it('returns false when resourceCounts is empty', () => {
      const wrapper = shallowMount(FleetSummaryGraphComponent, { propsData: { row: makeRow({ targetClusters: [{ id: 'cluster-1' }] }) } });

      expect((wrapper.vm as any).show).toBeFalsy();
    });
  });

  describe('stateParts', () => {
    it('filters out keys starting with "desired"', () => {
      const wrapper = shallowMount(FleetSummaryGraphComponent, {
        propsData: {
          row: makeRow({
            resourceCounts: {
              desiredReady: 5,
              ready:        5,
            },
            targetClusters: [{ id: 'cluster-1' }],
          }),
        },
      });

      const parts = (wrapper.vm as any).stateParts;

      expect(parts.every((p: any) => !p.label.startsWith('Desired'))).toBe(true);
    });

    it('filters out entries with value 0', () => {
      const wrapper = shallowMount(FleetSummaryGraphComponent, {
        propsData: {
          row: makeRow({
            resourceCounts: {
              desiredReady: 5,
              ready:        5,
              notReady:     0,
            },
            targetClusters: [{ id: 'cluster-1' }],
          }),
        },
      });

      const parts = (wrapper.vm as any).stateParts;
      const labels = parts.map((p: any) => p.label);

      expect(labels).toContain('Ready');
      expect(labels).not.toContain('NotReady');
    });
  });
});
