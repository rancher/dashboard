import type { Store } from 'vuex';
import { FLEET } from '@shell/config/types';
import { WORKSPACE_ANNOTATION } from '@shell/config/labels-annotations';
import { WORKSPACE } from '@shell/store/prefs';
import { checkSchemasForFindAllHash } from '@shell/utils/auth';
import FleetUtils from '@shell/utils/fleet';
import { HARVESTER_CONTAINER } from '@shell/store/features';
import { Target } from '@shell/types/fleet';

interface WorkspaceLike {
  id: string;
  nameDisplay?: string;
  metadata?: { annotations?: Record<string, string> };
}

interface FleetResource {
  nameDisplay?: string;
  metadata: { name: string, namespace: string };
}

export interface WorkspaceOption {
  label: string;
  value: string;
}

export const LOCAL_WORKSPACE = 'fleet-local';

export interface RetargetResult {
  targets: Target[] | undefined;
  removedClusters: string[];
  removedClusterGroups: string[];
}

/**
 * Without permission to list workspaces, they are recognised by the annotation Fleet puts on each
 * workspace namespace.
 */
export function fleetWorkspaceOptions(allWorkspaces: WorkspaceLike[] = [], allNamespaces: WorkspaceLike[] = []): WorkspaceOption[] {
  const workspaces = allWorkspaces.length ? allWorkspaces : allNamespaces.filter((ns) => ns.metadata?.annotations?.[WORKSPACE_ANNOTATION] === WORKSPACE);

  return workspaces.map((ws) => ({ label: ws.nameDisplay || ws.id, value: ws.id }));
}

/**
 * Point the header workspace at the workspace of the resource being worked on, so the list the
 * user returns to contains it.
 */
export function showFleetWorkspace(store: Store<any>, workspace?: string): void {
  if (workspace && store.getters.workspace !== workspace) {
    store.commit('updateWorkspace', { value: workspace, getters: store.getters });
  }
}

/**
 * Cluster names and cluster groups only mean something inside their own workspace. A target
 * entry naming one that does not exist in `workspace` can never match, so it is dropped; label
 * selectors carry over unchanged.
 *
 * The local workspace only offers its local cluster, so a resource moved there gets the targets a
 * new one is given (`localTargets`), whatever it had before.
 */
export function retargetToWorkspace(targets: Target[] | undefined, workspace: string, clusters: FleetResource[], clusterGroups: FleetResource[], localTargets?: Target[]): RetargetResult {
  const clusterNames = new Set(clusters
    .filter((c) => c.metadata?.namespace === workspace)
    .flatMap((c) => [c.metadata.name, c.nameDisplay]));
  const groupNames = new Set(clusterGroups
    .filter((g) => g.metadata?.namespace === workspace)
    .map((g) => g.metadata.name));

  const removedClusters: string[] = [];
  const removedClusterGroups: string[] = [];

  const kept = (targets || []).filter((target) => {
    let keep = true;

    if (target.clusterName && !clusterNames.has(target.clusterName)) {
      removedClusters.push(target.clusterName);
      keep = false;
    }

    if (target.clusterGroup && !groupNames.has(target.clusterGroup)) {
      removedClusterGroups.push(target.clusterGroup);
      keep = false;
    }

    return keep;
  });

  if (workspace === LOCAL_WORKSPACE && localTargets) {
    return {
      targets: localTargets, removedClusters, removedClusterGroups
    };
  }

  if (kept.length === (targets || []).length) {
    return {
      targets, removedClusters, removedClusterGroups
    };
  }

  return {
    targets: kept.length ? kept : undefined, removedClusters, removedClusterGroups
  };
}

export async function retargetToWorkspaceFromStore(store: Store<any>, targets: Target[] | undefined, workspace: string): Promise<RetargetResult> {
  const hash = await checkSchemasForFindAllHash({
    clusters: {
      inStoreType: 'management',
      type:        FLEET.CLUSTER
    },
    clusterGroups: {
      inStoreType: 'management',
      type:        FLEET.CLUSTER_GROUP
    },
  }, store) as { clusters?: FleetResource[], clusterGroups?: FleetResource[] };

  const { excludeHarvesterRule, includeAllWorkgroupRule } = FleetUtils.Application;
  const localTargets = [store.getters['features/get'](HARVESTER_CONTAINER) ? includeAllWorkgroupRule : excludeHarvesterRule];

  return retargetToWorkspace(targets, workspace, hash.clusters || [], hash.clusterGroups || [], localTargets);
}

/**
 * Whether a resource with this name exists in the namespace. One the user cannot read counts as
 * missing: they could not have picked it in the form either.
 */
export async function existsInNamespace(store: Store<any>, type: string, namespace: string, name: string): Promise<boolean> {
  try {
    const found = await store.dispatch('management/find', { type, id: `${ namespace }/${ name }` });

    return !!found;
  } catch (e) {
    return false;
  }
}
