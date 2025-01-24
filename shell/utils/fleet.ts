import {
  BundleDeploymentResource,
  BundleResourceKey,
  BundleDeployment,
  BundleDeploymentStatus,
  BundleStatus,
  Condition,
} from '@shell/types/resources/fleet';
import { STATES_ENUM } from '@shell/plugins/dashboard-store/resource-class';
import { FLEET as FLEET_LABELS } from '@shell/config/labels-annotations';

interface Resource extends BundleDeploymentResource {
  state: string,
}

type Labels = {
  [key: string]: string,
}

interface StatesCounter { [state: string]: number }

function incr(counter: StatesCounter, state: string) {
  if (!counter[state]) {
    counter[state] = 0;
  }
  counter[state]++;
}

function resourceKey(r: BundleResourceKey): string {
  return `${ r.kind }/${ r.namespace }/${ r.name }`;
}

function conditionIsTrue(conditions: Condition[] | undefined, type: string): boolean {
  if (!conditions) {
    return false;
  }

  return !!conditions.find((c) => c.type === type && c.status.toLowerCase() === 'true');
}

class Fleet {
  resourceId(r: BundleResourceKey): string {
    return r.namespace ? `${ r.namespace }/${ r.name }` : r.name;
  }

  /**
   * resourceType normalizes APIVersion and Kind from a Resources into a single string
   */
  resourceType(r: Resource): string {
    // ported from https://github.com/rancher/fleet/blob/v0.10.0/internal/cmd/controller/grutil/resourcekey.go#L116-L128
    const type = r.kind.toLowerCase();

    if (!r.apiVersion || r.apiVersion === 'v1') {
      return type;
    }

    return `${ r.apiVersion.split('/', 2)[0] }.${ type }`;
  }

  /**
   * resourcesFromBundleDeploymentStatus extracts the list of resources deployed by a BundleDeployment
   */
  resourcesFromBundleDeploymentStatus(status: BundleDeploymentStatus): Resource[] {
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
    for (const r of status?.nonReadyStatus || []) {
      const state = r.summary?.state || STATES_ENUM.UNKNOWN;
      const found: Resource = resources[resourceKey(r)];

      if (found) {
        found.state = state;
      }
    }

    return modified.concat(Object.values(resources));
  }

  /**
   * resourcesFromBundleStatus extracts the list of resources deployed by a Bundle
   */
  resourcesFromBundleStatus(status: BundleStatus): Resource[] {
    // The state of every resource is spread all over the bundle status.
    // resourceKey contains one entry per resource AND cluster (built by Fleet from all the child BundleDeployments).
    // However, those entries do not contain the cluster that they belong to, leading to duplicate entries

    // 1. Fold resourceKey by using a unique key, initializing counters for multiple occurrences of the same resource
    const resources = (status.resourceKey || []).reduce((res, r) => {
      const k = resourceKey(r);

      if (!res[k]) {
        res[k] = { r, count: {} };
      }
      incr(res[k].count, STATES_ENUM.READY);

      return res;
    }, {} as { [resourceKey: string]: { r: BundleResourceKey, count: StatesCounter } });

    // 2. Non-ready resources are counted differently and may also appear in resourceKey, depending on their state
    for (const bundle of status.summary?.nonReadyResources || []) {
      for (const r of bundle.modifiedStatus || []) {
        const k = resourceKey(r);

        if (!resources[k]) {
          resources[k] = { r, count: {} };
        }

        if (r.missing) {
          incr(resources[k].count, STATES_ENUM.MISSING);
        } else if (r.delete) {
          resources[k].count[STATES_ENUM.READY]--;
          incr(resources[k].count, STATES_ENUM.ORPHANED);
        } else {
          resources[k].count[STATES_ENUM.READY]--;
          incr(resources[k].count, STATES_ENUM.MODIFIED);
        }
      }
      for (const r of bundle.nonReadyStatus || []) {
        const k = resourceKey(r);
        const state = r.summary?.state || STATES_ENUM.UNKNOWN;

        resources[k].count[STATES_ENUM.READY]--;
        incr(resources[k].count, state);
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

  clusterIdFromBundleDeploymentLabels(labels?: Labels): string {
    const clusterNamespace = labels?.[FLEET_LABELS.CLUSTER_NAMESPACE];
    const clusterName = labels?.[FLEET_LABELS.CLUSTER];

    return `${ clusterNamespace }/${ clusterName }`;
  }

  bundleIdFromBundleDeploymentLabels(labels?: Labels): string {
    const bundleNamespace = labels?.[FLEET_LABELS.BUNDLE_NAMESPACE];
    const bundleName = labels?.[FLEET_LABELS.BUNDLE_NAME];

    return `${ bundleNamespace }/${ bundleName }`;
  }

  bundleDeploymentState(bd: BundleDeployment): string {
    // Ported from https://github.com/rancher/fleet/blob/534dbfdd6f74caf97bccd4cf977e42c5009b2432/internal/cmd/controller/summary/summary.go#L89
    if (bd.status?.appliedDeploymentId !== bd.spec.deploymentId) {
      return conditionIsTrue(bd.status?.conditions, 'Deployed') ? STATES_ENUM.WAIT_APPLIED : STATES_ENUM.ERR_APPLIED;
    } else if (!bd.status?.ready) {
      return STATES_ENUM.NOT_READY;
    } else if (bd.spec.deploymentId !== bd.spec.stagedDeploymentId) {
      return STATES_ENUM.OUT_OF_SYNC;
    } else if (!bd.status?.nonModified) {
      return STATES_ENUM.MODIFIED;
    } else {
      return STATES_ENUM.READY;
    }
  }
}

const instance = new Fleet();

export default instance;
