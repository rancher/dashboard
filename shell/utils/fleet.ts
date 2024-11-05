import { BundleDeploymentResource, ModifiedStatus, NonReadyBundle, ResourceKey } from '@shell/types/resources/fleet';
import { STATES_ENUM } from '@shell/plugins/dashboard-store/resource-class';
import { FLEET as FLEET_ANNOTATIONS } from '@shell/config/labels-annotations';

type state = STATES_ENUM.READY | STATES_ENUM.MODIFIED | STATES_ENUM.MISSING | STATES_ENUM.ORPHANED;

interface Resource extends BundleDeploymentResource {
  state: state,
}

interface BundleDeploymentStatus {
  resources?: BundleDeploymentResource[],
  modifiedStatus?: ModifiedStatus[],
}

interface BundleStatusSummary {
  nonReadyResources?: NonReadyBundle[],
}

interface BundleStatus {
  resourceKey?: ResourceKey[],
  summary?: BundleStatusSummary,
}

// bundleDeploymentResources extracts the list of resources deployed by a BundleDeployment
export function bundleDeploymentResources(status: BundleDeploymentStatus): Resource[] {
  // Use a map to avoid `find` over and over again
  const resourceKey = (r) => `${ r.kind }/${ r.namespace }/${ r.name }`;

  // status.resources includes of resources that were deployed by Fleet *and still exist in the cluster*
  const resources = (status?.resources || []).reduce((res, r) => {
    res[resourceKey(r)] = Object.assign({ state: STATES_ENUM.READY }, r);

    return res;
  }, {});

  const modified = [];

  for (const r of status?.modifiedStatus || []) {
    const state = r.missing ? STATES_ENUM.MISSING : r.delete ? STATES_ENUM.ORPHANED : STATES_ENUM.MODIFIED;
    const found = resources[resourceKey(r)];

    // Depending on the state, the same resource can appear in both fields
    if (found) {
      found.state = state;
    } else {
      modified.push(Object.assign({ state }, r));
    }
  }

  return modified.concat(Object.values(resources));
}

// bundleResources extracts the list of resources deployed by a Bundle
export function bundleResources(status: BundleStatus): Resource[] {
  const resources = (status.resourceKey || []).map((r) => {
    r.state = STATES_ENUM.READY;

    return r;
  });

  // The state of every resource is spread all over the bundle status.
  // resourceKey contains one entry per resource AND cluster (built by Fleet from all the child BundleDeployments).
  // However, those entries do not contain the cluster that they belong to, leading to duplicate entries
  for (const bundle of status.summary?.nonReadyResources || []) {
    for (const mod of bundle.modifiedStatus || []) {
      if (mod.missing) {
        resources.unshift(Object.assign({ state: STATES_ENUM.MISSING }, mod));
      } else {
        // There may be duplicate entries, pick the first one matching the condition
        const r = resources.find((r) => r.state === STATES_ENUM.READY &&
          resourceType(r) === resourceType(mod) && resourceId(r) === resourceId(mod));

        r.state = mod.delete ? STATES_ENUM.ORPHANED : STATES_ENUM.MODIFIED;
      }
    }
  }

  return resources;
}

// ported from https://github.com/rancher/fleet/blob/v0.10.0/internal/cmd/controller/grutil/resourcekey.go#L116-L128
export function resourceType(r: Resource): string {
  const type = r.kind.toLowerCase();

  if (!r.APIVersion || r.APIVersion === 'v1') {
    return type;
  }

  return `${ r.APIVersion.split('/', 2)[0] }.${ type }`;
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
