import { BundleDeploymentResource, ModifiedStatus } from '@shell/types/resources/fleet';
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
