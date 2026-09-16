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

  describe('state', () => {
    // Payloads as Steve serves them: `metadata.state` is normalised from the backend's
    // `status.display.state`, and the Ready condition flags every non-ready state as an
    // error that is transitioning.
    function createFleetBundle(stateName: string, message = '', error = false) {
      return new FleetBundle({
        metadata: {
          namespace: 'fleet-local',
          state:     {
            name: stateName, error, transitioning: false, message: ''
          }
        },
        status: {
          conditions: message ? [{
            type: 'Ready', status: 'False', error: true, transitioning: true, message
          }] : []
        },
      });
    }

    const waitingMessage = 'WaitingForDependency(1) [Cluster fleet-local/local: waiting for dependent bundle(s) to reach an accepted state: zz-dep-broken (state: ErrApplied, accepted: Ready)]';
    const errAppliedMessage = 'ErrApplied(1) [Cluster fleet-local/local: unable to build kubernetes objects from release manifest]';
    const notReadyMessage = 'NotReady(1) [Cluster fleet-local/local]; deployment.apps default/foo error] ReplicaSet has timed out progressing';

    it.each([
      ['waitingfordependency', waitingMessage, 'Waiting for Dependency', 'text-info'],
      ['errapplied', errAppliedMessage, 'Err Applied', 'text-error'],
      ['notready', notReadyMessage, 'Not Ready', 'text-warning'],
      ['modified', 'Modified(1) [Cluster fleet-local/local]', 'Modified', 'text-warning'],
      ['active', '', 'Active', 'text-success'],
    ])('should report %s as it is reported by the backend', (stateName, message, display, color) => {
      const bundle = createFleetBundle(stateName, message);

      expect(bundle.state).toBe(stateName);
      expect(bundle.stateDisplay).toBe(display);
      expect(bundle.stateColor).toBe(color);
    });

    it('should not report a bundle held back by a dependency as an error, even though the message names the dependency\'s ErrApplied state', () => {
      const bundle = createFleetBundle('waitingfordependency', waitingMessage);

      expect(bundle.state).not.toBe('errapplied');
      expect(bundle.stateColor).not.toBe('text-error');
    });

    it('should not report a bundle as an error because the word error appears in its message', () => {
      const bundle = createFleetBundle('notready', notReadyMessage);

      expect(bundle.state).toBe('notready');
      expect(bundle.stateColor).not.toBe('text-error');
    });

    // The backend raises `error` on anything that is not Ready, and does so unevenly - bundles in the
    // same state disagree on it - so the state itself has to decide the colour.
    describe('given the backend also flags the state as an error', () => {
      it.each([
        ['waitingfordependency', 'text-info'],
        ['waitapplied', 'text-info'],
        ['pending', 'text-info'],
        ['modified', 'text-warning'],
        ['notready', 'text-warning'],
      ])('should colour %s from the state, not from the flag', (stateName, color) => {
        const flagged = createFleetBundle(stateName, 'some message', true);
        const unflagged = createFleetBundle(stateName, 'some message', false);

        expect(flagged.stateColor).toBe(color);
        expect(flagged.stateColor).toBe(unflagged.stateColor);
      });

      it('should still colour a state the UI classifies as an error as an error', () => {
        const bundle = createFleetBundle('errapplied', 'ErrApplied(1) [...]', true);

        expect(bundle.stateColor).toBe('text-error');
      });

      it('should leave a state the UI does not know to the flag', () => {
        const bundle = createFleetBundle('somethingnewfromfleet', 'some message', true);

        expect(bundle.stateColor).toBe('text-error');
      });
    });

    describe('stateDescription', () => {
      it('should describe a non ready bundle with the Ready condition message', () => {
        const bundle = createFleetBundle('waitingfordependency', waitingMessage);

        expect(bundle.stateDescription).toBe(waitingMessage);
      });

      it('should not describe a ready bundle', () => {
        const bundle = createFleetBundle('active');

        expect(bundle.stateDescription).toBe('');
      });

      it('should not describe a ready bundle whose Ready condition carries a message', () => {
        const bundle = new FleetBundle({
          metadata: {
            namespace: 'fleet-local',
            state:     {
              name: 'active', error: false, transitioning: false, message: ''
            }
          },
          status: {
            conditions: [{
              type: 'Ready', status: 'True', message: 'Deployment ready'
            }]
          },
        });

        expect(bundle.stateDescription).toBe('');
      });
    });
  });
});
