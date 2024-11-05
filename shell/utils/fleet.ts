import { BundleDeploymentResource, BundleDeploymentModifiedStatus, BundleNonReadyBundle, BundleResourceKey } from '@shell/types/resources/fleet';
import { STATES_ENUM } from '@shell/plugins/dashboard-store/resource-class';
import { FLEET as FLEET_ANNOTATIONS } from '@shell/config/labels-annotations';

interface Resource extends BundleDeploymentResource {
  state: string,
}

interface BundleDeploymentStatus {
  resources?: BundleDeploymentResource[],
  modifiedStatus?: BundleDeploymentModifiedStatus[],
}

interface BundleStatusSummary {
  nonReadyResources?: BundleNonReadyBundle[],
}

interface BundleStatus {
  resourceKey?: BundleResourceKey[],
  summary?: BundleStatusSummary,
}

function resourceKey(r: BundleResourceKey): string {
  return `${ r.kind }/${ r.namespace }/${ r.name }`;
}

/**
 * bundleDeploymentResources extracts the list of resources deployed by a BundleDeployment
 */
export function bundleDeploymentResources(status: BundleDeploymentStatus): Resource[] {
  // status.resources includes of resources that were deployed by Fleet *and still exist in the cluster*
  // Use a map to avoid `find` over and over again
  const resources = (status?.resources || []).reduce((res, r) => {
    res[resourceKey(r)] = Object.assign({ state: STATES_ENUM.READY }, r);

    return res;
  }, {} as { [resourceKey: string]: Resource });

  const modified: Resource[] = [];

  for (const r of status?.modifiedStatus || []) {
    const state = r.missing ? STATES_ENUM.MISSING : r.delete ? STATES_ENUM.ORPHANED : STATES_ENUM.MODIFIED;
    const found: Resource = resources[resourceKey(r)];

    // Depending on the state, the same resource can appear in both fields
    if (found) {
      found.state = state;
    } else {
      modified.push(Object.assign({ state }, r));
    }
  }

  return modified.concat(Object.values(resources));
}

/**
 * bundleResources extracts the list of resources deployed by a Bundle
 */
export function bundleResources(status: BundleStatus): Resource[] {
  type counter = { [state: string]: number };
  const newCounter = (): counter => ({
    [STATES_ENUM.READY]:    0,
    [STATES_ENUM.MISSING]:  0,
    [STATES_ENUM.ORPHANED]: 0,
    [STATES_ENUM.MODIFIED]: 0,
  });
  // The state of every resource is spread all over the bundle status.
  // resourceKey contains one entry per resource AND cluster (built by Fleet from all the child BundleDeployments).
  // However, those entries do not contain the cluster that they belong to, leading to duplicate entries

  // 1. Fold resourceKey by using a unique key, initializing counters for multiple occurrences of the same resource
  const resources = (status.resourceKey || []).reduce((res, r) => {
    const k = resourceKey(r);

    if (!res[k]) {
      res[k] = { r, count: newCounter() };
    }
    res[k].count[STATES_ENUM.READY]++;

    return res;
  }, {} as { [resourceKey: string]: { r: BundleResourceKey, count: counter } });

  // 2. Non-ready resources are counted differently and may also appear in resourceKey, depending on their state
  for (const bundle of status.summary?.nonReadyResources || []) {
    for (const r of bundle.modifiedStatus || []) {
      const k = resourceKey(r);

      if (!resources[k]) {
        resources[k] = { r: r as BundleResourceKey, count: newCounter() };
      }

      if (r.missing) {
        resources[k].count[STATES_ENUM.MISSING]++;
      } else if (r.delete) {
        resources[k].count[STATES_ENUM.READY]--;
        resources[k].count[STATES_ENUM.ORPHANED]++;
      } else {
        resources[k].count[STATES_ENUM.READY]--;
        resources[k].count[STATES_ENUM.MODIFIED]++;
      }
    }
  }

  // 3. Unfold back to an array of resources for display
  return Object.values(resources).reduce((res, e) => {
    const { r, count } = e;

    for (const state in count) {
      for (let x = 0; x < count[state]; x++) {
        res.push(Object.assign({ state }, r));
      }
    }

    return res;
  }, [] as Resource[]);
}

/**
 * resourceType normalizes APIVersion and Kind from a Resources into a single string
 */
export function resourceType(r: Resource): string {
  // ported from https://github.com/rancher/fleet/blob/v0.10.0/internal/cmd/controller/grutil/resourcekey.go#L116-L128
  const type = r.kind.toLowerCase();

  if (!r.apiVersion || r.apiVersion === 'v1') {
    return type;
  }

  return `${ r.apiVersion.split('/', 2)[0] }.${ type }`;
}

export function resourceId(r: Resource): string {
  return r.namespace ? `${ r.namespace }/${ r.name }` : r.name;
}

type Labels = {
  [key: string]: string,
}

export function clusterIdFromBundleDeploymentLabels(labels?: Labels): string {
  const clusterNamespace = labels?.[FLEET_ANNOTATIONS.CLUSTER_NAMESPACE];
  const clusterName = labels?.[FLEET_ANNOTATIONS.CLUSTER];

  return `${ clusterNamespace }/${ clusterName }`;
}
