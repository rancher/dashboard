import { FLEET, SECRET } from '@shell/config/types';
import { WORKSPACE_ANNOTATION } from '@shell/config/labels-annotations';
import FleetUtils from '@shell/utils/fleet';
import {
  existsInNamespace, fleetWorkspaceOptions, retargetToWorkspace, retargetToWorkspaceFromStore, showFleetWorkspace
} from '@shell/utils/fleet-workspace';

const cluster = (namespace: string, name: string, nameDisplay = name) => ({ nameDisplay, metadata: { namespace, name } });
const group = (namespace: string, name: string) => ({ metadata: { namespace, name } });

describe('fleet-workspace', () => {
  describe('fleetWorkspaceOptions', () => {
    it('lists the workspaces', () => {
      const workspaces = [{ id: 'fleet-default', nameDisplay: 'fleet-default' }, { id: 'team-a', nameDisplay: 'Team A' }];

      expect(fleetWorkspaceOptions(workspaces, [])).toStrictEqual([
        { label: 'fleet-default', value: 'fleet-default' },
        { label: 'Team A', value: 'team-a' },
      ]);
    });

    it('falls back to the workspace namespaces when the workspaces cannot be listed', () => {
      const namespaces: { id: string, nameDisplay: string, metadata: { annotations?: Record<string, string> } }[] = [
        {
          id: 'team-a', nameDisplay: 'team-a', metadata: { annotations: { [WORKSPACE_ANNOTATION]: 'workspace' } }
        },
        {
          id: 'kube-system', nameDisplay: 'kube-system', metadata: { annotations: {} }
        },
        {
          id: 'no-annotations', nameDisplay: 'no-annotations', metadata: {}
        },
      ];

      expect(fleetWorkspaceOptions([], namespaces)).toStrictEqual([{ label: 'team-a', value: 'team-a' }]);
    });

    it('returns nothing when there is nothing to list', () => {
      expect(fleetWorkspaceOptions()).toStrictEqual([]);
    });
  });

  describe('showFleetWorkspace', () => {
    const storeWith = (workspace: string) => ({ getters: { workspace }, commit: jest.fn() }) as any;

    it('switches the header to the given workspace', () => {
      const store = storeWith('fleet-default');

      showFleetWorkspace(store, 'fleet-local');

      expect(store.commit).toHaveBeenCalledWith('updateWorkspace', { value: 'fleet-local', getters: store.getters });
    });

    it.each([
      ['it is already selected', 'fleet-default'],
      ['no workspace is given', undefined],
      ['the workspace is empty', ''],
    ])('does nothing when %s', (_, workspace) => {
      const store = storeWith('fleet-default');

      showFleetWorkspace(store, workspace);

      expect(store.commit).not.toHaveBeenCalled();
    });
  });

  describe('retargetToWorkspace', () => {
    const clusters = [cluster('fleet-default', 'c-abc', 'downstream'), cluster('team-a', 'c-xyz', 'team-cluster'), cluster('fleet-local', 'local')];
    const groups = [group('fleet-default', 'prod'), group('team-a', 'prod'), group('team-a', 'team-group')];

    it('keeps targets that exist in the new workspace, matching a cluster by name or display name', () => {
      const targets = [{ clusterName: 'c-xyz' }, { clusterName: 'team-cluster' }, { clusterGroup: 'prod' }];

      const res = retargetToWorkspace(targets, 'team-a', clusters, groups);

      expect(res.targets).toBe(targets);
      expect(res.removedClusters).toStrictEqual([]);
      expect(res.removedClusterGroups).toStrictEqual([]);
    });

    it('drops the clusters and cluster groups that do not exist in the new workspace, keeping label selectors', () => {
      const selector = { clusterSelector: { matchLabels: { env: 'dev' } } };
      const groupSelector = { clusterGroupSelector: { matchLabels: { tier: 'one' } } };
      const targets = [{ clusterName: 'c-xyz' }, selector, { clusterGroup: 'team-group' }, { clusterGroup: 'prod' }, groupSelector];

      const res = retargetToWorkspace(targets, 'fleet-default', clusters, groups);

      expect(res.targets).toStrictEqual([selector, { clusterGroup: 'prod' }, groupSelector]);
      expect(res.removedClusters).toStrictEqual(['c-xyz']);
      expect(res.removedClusterGroups).toStrictEqual(['team-group']);
    });

    it('drops an entry naming a missing cluster even when it also has a selector, since it can never match', () => {
      const targets = [{ clusterName: 'c-abc', clusterSelector: { matchLabels: { env: 'dev' } } }];

      const res = retargetToWorkspace(targets, 'team-a', clusters, groups);

      expect(res.targets).toBeUndefined();
      expect(res.removedClusters).toStrictEqual(['c-abc']);
    });

    it('reports both a missing cluster and a missing group of the same entry', () => {
      const res = retargetToWorkspace([{ clusterName: 'c-abc', clusterGroup: 'team-group' }], 'fleet-local', clusters, groups);

      expect(res.targets).toBeUndefined();
      expect(res.removedClusters).toStrictEqual(['c-abc']);
      expect(res.removedClusterGroups).toStrictEqual(['team-group']);
    });

    it('leaves no targets, rather than an empty list, when every target is dropped', () => {
      const res = retargetToWorkspace([{ clusterName: 'c-abc' }], 'team-a', clusters, groups);

      expect(res.targets).toBeUndefined();
    });

    it('gives a resource moved to the local workspace the targets of a new one there', () => {
      const localTargets = [{ clusterSelector: { matchExpressions: [] } }];
      const res = retargetToWorkspace([{ clusterName: 'c-abc' }, { clusterSelector: { matchLabels: { env: 'dev' } } }], 'fleet-local', clusters, groups, localTargets);

      expect(res.targets).toBe(localTargets);
      expect(res.removedClusters).toStrictEqual(['c-abc']);
    });

    it('keeps the targets of a resource moved to the local workspace when no local targets are given', () => {
      const targets = [{ clusterName: 'local' }];

      expect(retargetToWorkspace(targets, 'fleet-local', clusters, groups).targets).toBe(targets);
    });

    it.each([
      ['undefined', undefined],
      ['empty', []],
    ])('leaves %s targets as they are', (_, targets) => {
      const res = retargetToWorkspace(targets, 'team-a', clusters, groups);

      expect(res.targets).toBe(targets);
    });
  });

  describe('retargetToWorkspaceFromStore', () => {
    it('loads the clusters and cluster groups the user can see', async() => {
      const all: Record<string, any[]> = {
        [FLEET.CLUSTER]:       [cluster('team-a', 'c-xyz')],
        [FLEET.CLUSTER_GROUP]: [group('team-a', 'team-group')],
      };
      const store = {
        getters:  { 'management/schemaFor': () => ({}), 'features/get': () => false },
        dispatch: jest.fn((action: string, { type }: { type: string }) => Promise.resolve(all[type])),
      } as any;

      const res = await retargetToWorkspaceFromStore(store, [{ clusterName: 'c-xyz' }, { clusterName: 'c-abc' }, { clusterGroup: 'team-group' }], 'team-a');

      expect(res.targets).toStrictEqual([{ clusterName: 'c-xyz' }, { clusterGroup: 'team-group' }]);
      expect(res.removedClusters).toStrictEqual(['c-abc']);
    });

    it('drops every named target when the user cannot list clusters or groups', async() => {
      const store = { getters: { 'management/schemaFor': () => null, 'features/get': () => false }, dispatch: jest.fn() } as any;

      const res = await retargetToWorkspaceFromStore(store, [{ clusterName: 'c-xyz' }, { clusterSelector: { matchLabels: { a: 'b' } } }], 'team-a');

      expect(store.dispatch).not.toHaveBeenCalled();
      expect(res.targets).toStrictEqual([{ clusterSelector: { matchLabels: { a: 'b' } } }]);
    });
  });

  describe('retargetToWorkspaceFromStore to the local workspace', () => {
    it.each([
      ['hidden', false, FleetUtils.Application.excludeHarvesterRule],
      ['shown', true, FleetUtils.Application.includeAllWorkgroupRule],
    ])('targets every cluster, with harvester hosts %s', async(_, harvesterVisible, rule) => {
      const store = { getters: { 'management/schemaFor': () => null, 'features/get': () => harvesterVisible }, dispatch: jest.fn() } as any;

      const res = await retargetToWorkspaceFromStore(store, [{ clusterSelector: { matchLabels: { a: 'b' } } }], 'fleet-local');

      expect(res.targets).toStrictEqual([rule]);
    });
  });

  describe('existsInNamespace', () => {
    it('looks the resource up by its namespaced id', async() => {
      const store = { dispatch: jest.fn().mockResolvedValue({ id: 'team-a/creds' }) } as any;

      await expect(existsInNamespace(store, SECRET, 'team-a', 'creds')).resolves.toBe(true);
      expect(store.dispatch).toHaveBeenCalledWith('management/find', { type: SECRET, id: 'team-a/creds' });
    });

    it.each([
      ['it is not found', { status: 404 }],
      ['the user may not read it', { status: 403 }],
    ])('is false when %s', async(_, error) => {
      const store = { dispatch: jest.fn().mockRejectedValue(error) } as any;

      await expect(existsInNamespace(store, SECRET, 'team-a', 'creds')).resolves.toBe(false);
    });
  });
});
