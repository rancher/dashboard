import { isEmpty, isEqual } from 'lodash';
import {
  BundleDeploymentResource,
  BundleResourceKey,
  BundleDeployment,
  BundleDeploymentStatus,
  Condition,
} from '@shell/types/resources/fleet';
import { mapStateToEnum, STATES_ENUM, STATES } from '@shell/plugins/dashboard-store/resource-class';
import { FLEET as FLEET_LABELS, CAPI } from '@shell/config/labels-annotations';
import { NAME as EXPLORER_NAME } from '@shell/config/product/explorer';
import { FleetDashboardState, FleetResourceState, Target, TargetMode } from '@shell/types/fleet';
import { FLEET, VIRTUAL_HARVESTER_PROVIDER } from '@shell/config/types';

interface Resource extends BundleDeploymentResource {
  state: string,
}

type Labels = {
  [key: string]: string,
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

class Application {
  excludeHarvesterRule = {
    clusterSelector: {
      matchExpressions: [{
        key:      CAPI.PROVIDER,
        operator: 'NotIn',
        values:   [
          VIRTUAL_HARVESTER_PROVIDER
        ],
      }],
    },
  };

  getTargetMode(targets: Target[], namespace: string): TargetMode {
    if (namespace === 'fleet-local') {
      return 'local';
    }

    if (!targets.length) {
      return 'none';
    }

    let mode: TargetMode = 'all';

    for (const target of targets) {
      const {
        clusterName,
        clusterSelector,
        clusterGroup,
        clusterGroupSelector,
      } = target;

      if (clusterGroup || clusterGroupSelector) {
        return 'advanced';
      }

      if (clusterName) {
        mode = 'clusters';
      }

      if (!isEmpty(clusterSelector)) {
        mode = 'clusters';
      }
    }

    const normalized = [...targets].map((target) => {
      delete target.name;

      return target;
    });

    // Check if targets contains only harvester rule after name normalizing
    if (isEqual(normalized, [this.excludeHarvesterRule])) {
      mode = 'all';
    }

    return mode;
  }
}

class Fleet {
  resourceIcons = {
    [FLEET.GIT_REPO]: 'icon icon-github',
    [FLEET.HELM_OP]:  'icon icon-helm',
  };

  dashboardIcons = {
    [FLEET.GIT_REPO]: 'icon icon-git',
    [FLEET.HELM_OP]:  'icon icon-helm',
  };

  dashboardStates: FleetDashboardState[] = [
    {
      index:           0,
      id:              'error',
      label:           'Error',
      color:           '#F64747',
      icon:            'icon icon-error',
      stateBackground: 'bg-error'
    },
    {
      index:           1,
      id:              'warning',
      label:           'Warning',
      color:           '#DAC342',
      icon:            'icon icon-warning',
      stateBackground: 'bg-warning'
    },
    {
      index:           2,
      id:              'success',
      label:           'Active',
      color:           '#5D995D',
      icon:            'icon icon-checkmark',
      stateBackground: 'bg-success'
    },
    {
      index:           3,
      id:              'info',
      label:           'Pending',
      color:           '#3d98d3',
      icon:            'icon icon-warning',
      stateBackground: 'bg-info'
    },
  ];

  Application = new Application();

  GIT_HTTPS_REGEX = /^https?:\/\/github\.com\/(.*?)(\.git)?\/*$/;
  GIT_SSH_REGEX = /^git@github\.com:.*\.git$/;
  HTTP_REGEX = /^(https?:\/\/[^\s]+)$/;
  OCI_REGEX = /^oci:\/\//;

  quacksLikeAHash(str: string) {
    if (str.match(/^[a-f0-9]{40,}$/i)) {
      return true;
    }

    return false;
  }

  parseSSHUrl(url: string) {
    const parts = (url || '').split(':');

    const sshUserAndHost = parts[0];
    const repoPath = parts[1]?.replace('.git', '');

    return {
      sshUserAndHost,
      repoPath
    };
  }

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

  detailLocation(r: Resource, mgmtClusterName: string): any {
    const location = mapStateToEnum(r.state) === STATES_ENUM.MISSING ? undefined : {
      name:   `c-cluster-product-resource${ r.namespace ? '-namespace' : '' }-id`,
      params: {
        product:   EXPLORER_NAME,
        cluster:   mgmtClusterName,
        resource:  this.resourceType(r),
        namespace: r.namespace,
        id:        r.name,
      },
    };

    // Having an undefined param can yield a console warning like [Vue Router warn]: Discarded invalid param(s) "namespace" when navigating
    if (location && !location.params.namespace) {
      delete location.params.namespace;
    }

    return location;
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

  getResourcesDefaultState(labelGetter: (key: string, args: any, fallback: any) => Record<string, any>, stateKey: string): Record<string, FleetResourceState> {
    return [
      STATES_ENUM.READY,
      STATES_ENUM.NOT_READY,
      STATES_ENUM.WAIT_APPLIED,
      STATES_ENUM.MODIFIED,
      STATES_ENUM.MISSING,
      STATES_ENUM.ORPHANED,
      STATES_ENUM.UNKNOWN,
    ].reduce((acc: Record<string, any>, state) => {
      acc[state] = {
        count:  0,
        color:  STATES[state].color,
        label:  labelGetter(`${ stateKey }.${ state }`, null, STATES[state].label ),
        status: state
      };

      return acc;
    }, {});
  }

  getBundlesDefaultState(labelGetter: (key: string, args: any, fallback: any) => Record<string, any>, stateKey: string): Record<string, FleetResourceState> {
    return [
      STATES_ENUM.READY,
      STATES_ENUM.INFO,
      STATES_ENUM.WARNING,
      STATES_ENUM.NOT_READY,
      STATES_ENUM.ERROR,
      STATES_ENUM.ERR_APPLIED,
      STATES_ENUM.WAIT_APPLIED,
      STATES_ENUM.UNKNOWN,
    ].reduce((acc: Record<string, any>, state) => {
      acc[state] = {
        count:  0,
        color:  STATES[state].color,
        label:  labelGetter(`${ stateKey }.${ state }`, null, STATES[state].label ),
        status: state
      };

      return acc;
    }, {});
  }

  getDashboardStateId(resource: { stateColor: string }): string {
    return resource?.stateColor?.replace('text-', '') || 'warning';
  }

  getDashboardState(resource: { stateColor: string }): FleetDashboardState | {} {
    const stateId = this.getDashboardStateId(resource);

    return this.dashboardStates.find(({ id }) => stateId === id) || {};
  }
}

const instance = new Fleet();

export default instance;
