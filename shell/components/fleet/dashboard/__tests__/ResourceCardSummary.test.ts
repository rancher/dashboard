import { shallowMount } from '@vue/test-utils';
import ResourceCardSummary from '@shell/components/fleet/dashboard/ResourceCardSummary.vue';

const mountSummary = (value: Record<string, unknown>, noClusters = false) => {
  return shallowMount(ResourceCardSummary as any, {
    props:  { value, noClusters },
    global: {
      mocks: {
        t:      (k: string) => k,
        $store: { getters: { 'i18n/withFallback': () => '' } },
      },
    },
  });
};

describe('component: FleetDashboardResourceCardSummary', () => {
  describe('summary counts', () => {
    it('coerces a missing ready count to 0 instead of producing NaN', () => {
      // The backend omits `ready` from resourceCounts when nothing is ready - this used to make
      // `desiredReady - ready` evaluate to NaN on the card.
      const wrapper = mountSummary({ status: { resourceCounts: { desiredReady: 2, notReady: 2 } } });

      const { summary } = wrapper.vm as any;

      expect(summary.partial).toBe(2);
      expect(summary.total).toBe(2);
      expect(Number.isNaN(summary.partial)).toBe(false);
    });

    it('shows the not-ready count out of the total when partially ready', () => {
      const wrapper = mountSummary({ status: { resourceCounts: { desiredReady: 31, ready: 23 } } });

      const { summary } = wrapper.vm as any;

      expect(summary.partial).toBe(8);
      expect(summary.total).toBe(31);
    });

    it('returns zeroed counts when resourceCounts is absent', () => {
      const wrapper = mountSummary({ status: {} });

      const { summary } = wrapper.vm as any;

      expect(summary.partial).toBe(0);
      expect(summary.total).toBe(0);
    });
  });

  describe('cluster count', () => {
    it('derives the cluster count from status.perClusterResourceCounts, not loaded clusters', () => {
      // On the dashboard the application's clusters aren't loaded (targetClusters is empty), so the
      // count must come from per-cluster status keyed by cluster id.
      const wrapper = mountSummary({
        targetClusters: [],
        status:         {
          resourceCounts:           { desiredReady: 7, ready: 7 },
          perClusterResourceCounts: {
            'fleet-default/cluster-a': { desiredReady: 7, ready: 7 },
            'fleet-default/cluster-b': { desiredReady: 7, ready: 7 },
          },
        },
      });

      expect((wrapper.vm as any).summary.clusters).toBe(2);
    });

    it('counts only the not-ready clusters when the application is partially ready', () => {
      const wrapper = mountSummary({
        targetClusters: [],
        status:         {
          resourceCounts:           { desiredReady: 14, ready: 7 },
          perClusterResourceCounts: {
            'fleet-default/cluster-a': { desiredReady: 7, ready: 7 },
            'fleet-default/cluster-b': { desiredReady: 7, ready: 0 },
          },
        },
      });

      expect((wrapper.vm as any).summary.clusters).toBe(1);
    });

    it('reports zero clusters when nothing has been deployed yet', () => {
      const wrapper = mountSummary({ targetClusters: [], status: { resourceCounts: { desiredReady: 0 } } });

      expect((wrapper.vm as any).summary.clusters).toBe(0);
    });
  });
});
