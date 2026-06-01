import FleetApplication from '@shell/models/fleet-application.js';

describe('class FleetApplication', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('targetClusters', () => {
    function createFleetApplication(targets: any[] | undefined, clusters: any[], workspaceId = 'fleet-default', groups: any[] = []) {
      const workspace = {
        id: workspaceId,
        clusters,
        clusterGroups: groups,
      };

      jest.spyOn(FleetApplication.prototype, '$getters', 'get').mockReturnValue({ byId: () => workspace });

      return new FleetApplication({
        metadata: { namespace: workspaceId },
        spec:     { targets },
      });
    }

    it.each([
      [
        'metadata.name',
        [{ clusterName: 'c-m-abc123' }],
        [{ id: 'fleet-default/c-m-abc123', metadata: { name: 'c-m-abc123' }, nameDisplay: 'my-cluster' }],
        [{ id: 'fleet-default/c-m-abc123', metadata: { name: 'c-m-abc123' }, nameDisplay: 'my-cluster' }],
      ],
      [
        'nameDisplay when metadata.name does not match',
        [{ clusterName: 'my-display-name' }],
        [{ id: 'fleet-default/c-m-abc123', metadata: { name: 'c-m-abc123' }, nameDisplay: 'my-display-name' }],
        [{ id: 'fleet-default/c-m-abc123', metadata: { name: 'c-m-abc123' }, nameDisplay: 'my-display-name' }],
      ],
    ])('should find cluster by %s', (_label, targets, clusters, expected) => {
      const app = createFleetApplication(targets, clusters);

      expect(app.targetClusters).toStrictEqual(expected);
    });

    it('should prefer metadata.name match over nameDisplay match', () => {
      const clusters = [
        {
          id:          'fleet-default/exact-match',
          metadata:    { name: 'exact-match' },
          nameDisplay: 'display-a',
        },
        {
          id:          'fleet-default/c-m-other',
          metadata:    { name: 'c-m-other' },
          nameDisplay: 'exact-match',
        }
      ];

      const app = createFleetApplication([{ clusterName: 'exact-match' }], clusters);

      expect(app.targetClusters).toStrictEqual([clusters[0]]);
    });

    it('should return empty array when no cluster matches by name or nameDisplay', () => {
      const clusters = [
        {
          id:          'fleet-default/c-m-abc123',
          metadata:    { name: 'c-m-abc123' },
          nameDisplay: 'my-cluster',
        }
      ];

      const app = createFleetApplication([{ clusterName: 'non-existent' }], clusters);

      expect(app.targetClusters).toStrictEqual([]);
    });

    it('should handle multiple targets with mixed name and nameDisplay matches', () => {
      const clusters = [
        {
          id:          'fleet-default/c-m-abc123',
          metadata:    { name: 'c-m-abc123' },
          nameDisplay: 'cluster-alpha',
        },
        {
          id:          'fleet-default/c-m-def456',
          metadata:    { name: 'c-m-def456' },
          nameDisplay: 'cluster-beta',
        }
      ];

      const targets = [
        { clusterName: 'c-m-abc123' },
        { clusterName: 'cluster-beta' },
      ];

      const app = createFleetApplication(targets, clusters);

      expect(app.targetClusters).toStrictEqual([clusters[0], clusters[1]]);
    });

    it('should return empty array when targets is empty', () => {
      const app = createFleetApplication([], []);

      expect(app.targetClusters).toStrictEqual([]);
    });

    it('should return empty array when targets is undefined', () => {
      const app = createFleetApplication(undefined, []);

      expect(app.targetClusters).toStrictEqual([]);
    });

    it('should return empty array when workspace has no clusters', () => {
      const app = createFleetApplication([{ clusterName: 'any-name' }], []);

      expect(app.targetClusters).toStrictEqual([]);
    });

    it('should handle cluster with undefined nameDisplay gracefully', () => {
      const clusters = [
        {
          id:          'fleet-default/c-m-abc123',
          metadata:    { name: 'c-m-abc123' },
          nameDisplay: undefined,
        }
      ];

      const app = createFleetApplication([{ clusterName: 'c-m-abc123' }], clusters);

      expect(app.targetClusters).toStrictEqual([clusters[0]]);
    });

    it('should return local cluster targets when workspace is fleet-local', () => {
      const localTargetClusters = [
        {
          id:          'fleet-local/local',
          metadata:    { name: 'local' },
          nameDisplay: 'local',
        }
      ];

      const groups = [
        {
          id:             'fleet-local/default',
          targetClusters: localTargetClusters,
        }
      ];

      const app = createFleetApplication([], [], 'fleet-local', groups);

      expect(app.targetClusters).toStrictEqual(localTargetClusters);
    });

    it('should return empty array when workspace is fleet-local and default group is missing', () => {
      const app = createFleetApplication([], [], 'fleet-local', []);

      expect(app.targetClusters).toStrictEqual([]);
    });
  });
});
