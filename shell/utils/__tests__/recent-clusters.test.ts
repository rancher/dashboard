import { addRecentCluster, visibleRecentClusters } from '@shell/utils/recent-clusters';

describe('fx: recent-clusters', () => {
  describe('addRecentCluster', () => {
    it('adds a first visit', () => {
      expect(addRecentCluster([], 'c-a')).toStrictEqual(['c-a']);
    });

    it('puts the most-recent visit at the front', () => {
      expect(addRecentCluster(['c-a'], 'c-b')).toStrictEqual(['c-b', 'c-a']);
    });

    it('de-duplicates: re-visiting moves the cluster back to the front', () => {
      expect(addRecentCluster(['c-b', 'c-a'], 'c-a')).toStrictEqual(['c-a', 'c-b']);
    });

    it('records a visit regardless of pinned status (pinned only affects display)', () => {
      // The list grows with every visit; pinning is NOT filtered here.
      expect(addRecentCluster(['c-b', 'c-a'], 'c-c')).toStrictEqual(['c-c', 'c-b', 'c-a']);
    });

    it('grows past the display cap of 3 (it is a visit log, not a curated list)', () => {
      expect(addRecentCluster(['c-c', 'c-b', 'c-a'], 'c-d')).toStrictEqual(['c-d', 'c-c', 'c-b', 'c-a']);
    });

    it('bounds storage at max, evicting the oldest', () => {
      expect(addRecentCluster(['c-c', 'c-b', 'c-a'], 'c-d', { max: 3 })).toStrictEqual(['c-d', 'c-c', 'c-b']);
    });

    it('is a no-op for a missing id', () => {
      expect(addRecentCluster(['c-a'], '')).toStrictEqual(['c-a']);
    });

    it('does not mutate the input array', () => {
      const recents = ['c-a'];

      addRecentCluster(recents, 'c-b');
      expect(recents).toStrictEqual(['c-a']);
    });

    it('tolerates a non-array input', () => {
      expect(addRecentCluster(undefined as any, 'c-a')).toStrictEqual(['c-a']);
    });
  });

  describe('visibleRecentClusters', () => {
    it('drops pinned clusters and caps at the display limit', () => {
      // pinned 'c-b' filtered out, then latest 3 shown, order preserved
      expect(visibleRecentClusters(['c-a', 'c-b', 'c-c', 'c-d', 'c-e'], ['c-b'], 3)).toStrictEqual(['c-a', 'c-c', 'c-d']);
    });

    it('keeps a cluster that is recent but not pinned', () => {
      expect(visibleRecentClusters(['c-a', 'c-b'], [], 3)).toStrictEqual(['c-a', 'c-b']);
    });

    it('can hide everything when all recents are pinned', () => {
      expect(visibleRecentClusters(['c-a', 'c-b'], ['c-a', 'c-b'], 3)).toStrictEqual([]);
    });

    it('tolerates non-array inputs', () => {
      expect(visibleRecentClusters(undefined as any, undefined as any, 3)).toStrictEqual([]);
    });
  });
});
