import FleetBundle from '@shell/models/fleet.cattle.io.bundle.js';

describe('class FleetBundle', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('targetClusters', () => {
    function createFleetBundle(targets: any[], clusters: any[], workspaceId = 'fleet-default', groups: any[] = [], bundleNamespaceMappings: any[] = [], allWorkspaces: any[] = [], bundleLabels: Record<string, string> = {}) {
      const workspace = {
        id:            workspaceId,
        metadata:      { name: workspaceId },
        clusters,
        clusterGroups: groups,
      };

      jest.spyOn(FleetBundle.prototype, '$getters', 'get').mockReturnValue({
        byId: (_type: string, id: string) => {
          if (id === workspaceId) {
            return workspace;
          }

          return allWorkspaces.find((ws: any) => ws.metadata?.name === id);
        },
        all: (type: string) => {
          if (type === 'fleet.cattle.io.bundlenamespacemapping') {
            return bundleNamespaceMappings;
          }
          if (type === 'management.cattle.io.fleetworkspace') {
            return allWorkspaces;
          }

          return [];
        },
      });

      return new FleetBundle({
        metadata: { namespace: workspaceId, labels: bundleLabels },
        spec:     { targets },
      });
    }

    it.each([
      [
        'metadata.name',
        [{ clusterName: 'c-m-abc123' }],
        [{
          id: 'fleet-default/c-m-abc123', metadata: { name: 'c-m-abc123' }, nameDisplay: 'my-cluster'
        }],
        [{
          id: 'fleet-default/c-m-abc123', metadata: { name: 'c-m-abc123' }, nameDisplay: 'my-cluster'
        }],
      ],
      [
        'nameDisplay when metadata.name does not match',
        [{ clusterName: 'my-display-name' }],
        [{
          id: 'fleet-default/c-m-abc123', metadata: { name: 'c-m-abc123' }, nameDisplay: 'my-display-name'
        }],
        [{
          id: 'fleet-default/c-m-abc123', metadata: { name: 'c-m-abc123' }, nameDisplay: 'my-display-name'
        }],
      ],
    ])('should find cluster by %s', (_label, targets, clusters, expected) => {
      const bundle = createFleetBundle(targets, clusters);

      expect(bundle.targetClusters).toStrictEqual(expected);
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

      const bundle = createFleetBundle([{ clusterName: 'exact-match' }], clusters);

      expect(bundle.targetClusters).toStrictEqual([clusters[0]]);
    });

    it('should return empty array when no cluster matches by name or nameDisplay', () => {
      const clusters = [
        {
          id:          'fleet-default/c-m-abc123',
          metadata:    { name: 'c-m-abc123' },
          nameDisplay: 'my-cluster',
        }
      ];

      const bundle = createFleetBundle([{ clusterName: 'non-existent' }], clusters);

      expect(bundle.targetClusters).toStrictEqual([]);
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

      const bundle = createFleetBundle(targets, clusters);

      expect(bundle.targetClusters).toStrictEqual([clusters[0], clusters[1]]);
    });

    it('should return empty array when workspace has no clusters', () => {
      const bundle = createFleetBundle([{ clusterName: 'any-name' }], []);

      expect(bundle.targetClusters).toStrictEqual([]);
    });

    it('should handle cluster with undefined nameDisplay gracefully', () => {
      const clusters = [
        {
          id:          'fleet-default/c-m-abc123',
          metadata:    { name: 'c-m-abc123' },
          nameDisplay: undefined,
        }
      ];

      const bundle = createFleetBundle([{ clusterName: 'c-m-abc123' }], clusters);

      expect(bundle.targetClusters).toStrictEqual([clusters[0]]);
    });

    it('should not match by nameDisplay when nameDisplay is undefined and target uses a different name', () => {
      const clusters = [
        {
          id:          'fleet-default/c-m-abc123',
          metadata:    { name: 'c-m-abc123' },
          nameDisplay: undefined,
        }
      ];

      const bundle = createFleetBundle([{ clusterName: 'some-other-name' }], clusters);

      expect(bundle.targetClusters).toStrictEqual([]);
    });

    it('should include clusters from namespaces mapped via BundleNamespaceMapping', () => {
      const mappedClusters = [
        {
          id:          'fleet-default/c-m-mapped1',
          metadata:    { name: 'c-m-mapped1' },
          nameDisplay: 'mapped-cluster',
        }
      ];

      const bundleNamespaceMappings = [{
        metadata:          { namespace: 'fleet-new' },
        bundleSelector:    { matchLabels: { team: 'one' } },
        namespaceSelector: { matchLabels: { 'kubernetes.io/metadata.name': 'fleet-default' } },
      }];

      const mappedWorkspace = {
        id:            'fleet-default',
        metadata:      { name: 'fleet-default', labels: {} },
        clusters:      mappedClusters,
        clusterGroups: [],
      };

      const bundle = createFleetBundle(
        [{ clusterSelector: {} }],
        [],
        'fleet-new',
        [],
        bundleNamespaceMappings,
        [mappedWorkspace],
        { team: 'one' },
      );

      expect(bundle.targetClusters).toStrictEqual(mappedClusters);
    });

    it('should not include clusters when bundle does not match BundleNamespaceMapping selector', () => {
      const mappedClusters = [
        {
          id:          'fleet-default/c-m-mapped1',
          metadata:    { name: 'c-m-mapped1' },
          nameDisplay: 'mapped-cluster',
        }
      ];

      const bundleNamespaceMappings = [{
        metadata:          { namespace: 'fleet-new' },
        bundleSelector:    { matchLabels: { team: 'two' } },
        namespaceSelector: { matchLabels: { 'kubernetes.io/metadata.name': 'fleet-default' } },
      }];

      const mappedWorkspace = {
        id:            'fleet-default',
        metadata:      { name: 'fleet-default', labels: {} },
        clusters:      mappedClusters,
        clusterGroups: [],
      };

      const bundle = createFleetBundle(
        [{ clusterSelector: {} }],
        [],
        'fleet-new',
        [],
        bundleNamespaceMappings,
        [mappedWorkspace],
        { team: 'one' },
      );

      expect(bundle.targetClusters).toStrictEqual([]);
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

      const bundle = createFleetBundle([], [], 'fleet-local', groups);

      expect(bundle.targetClusters).toStrictEqual(localTargetClusters);
    });

    it('should return empty array when workspace is fleet-local and default group is missing', () => {
      const bundle = createFleetBundle([], [], 'fleet-local', []);

      expect(bundle.targetClusters).toStrictEqual([]);
    });
  });
});
