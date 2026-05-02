import { BundleDeployment, BundleDeploymentStatus } from '@shell/types/resources/fleet';
import { Target } from '@shell/types/fleet';
import FleetUtils from '@shell/utils/fleet';
import { FLEET as FLEET_LABELS } from '@shell/config/labels-annotations';
import { STATES_ENUM } from '@shell/plugins/dashboard-store/resource-class';

describe('fx: util.getTargetMode', () => {
  const util = FleetUtils.Application;

  it('should return "all" when targets contain excludeHarvesterRule and namespace is not fleet-local', () => {
    const targets = [{
      clusterSelector: {
        matchExpressions: [{
          key:      'provider.cattle.io',
          operator: 'NotIn',
          values:   ['harvester'],
        }],
      },
    }];
    const namespace = 'ws1';

    expect(util.getTargetMode(targets, namespace)).toBe('all');
  });

  it('should return "clusters" when targets include clusterName and clusterSelector', () => {
    const targets = [{ clusterName: 'fleet-5-france' }, { clusterSelector: { matchLabels: { foo: 'true' } } }];
    const namespace = 'ws1';

    expect(util.getTargetMode(targets, namespace)).toBe('clusters');
  });

  it('should return "clusters" when targets only include multiple clusterSelectors', () => {
    const targets: Target[] = [{ clusterSelector: { matchLabels: { foo: 'true' } } }, { clusterSelector: { matchLabels: { hci: 'true' } } }];
    const namespace = 'ws1';

    expect(util.getTargetMode(targets, namespace)).toBe('clusters');
  });

  it('should return "advanced" when a target contains clusterGroupSelector', () => {
    const targets = [{ clusterGroupSelector: {} }];
    const namespace = 'ws1';

    expect(util.getTargetMode(targets, namespace)).toBe('advanced');
  });

  it('should return "advanced" when any target contains clusterGroup or clusterGroupSelector', () => {
    const targets = [{
      clusterGroup:         'cg1',
      clusterGroupSelector: {
        matchExpressions: [{
          key:      'string',
          operator: 'string',
          values:   ['string']
        }],
        matchLabels: { foo: 'bar' }
      },
      clusterName:     'pippo',
      clusterSelector: {
        matchExpressions: [{
          key:      'string',
          operator: 'string',
          values:   ['vvv']
        }],
        matchLabels: { foo: 'bar' }
      },
      name: 'tt1',
    }, {
      clusterGroup:         'cg2',
      clusterGroupSelector: {
        matchExpressions: [{
          key:      'string',
          operator: 'string',
          values:   ['string']
        }],
        matchLabels: { foo: 'bar' }
      },
      clusterName:     'pippo',
      clusterSelector: {
        matchExpressions: [{
          key:      'string',
          operator: 'string',
          values:   ['vvv']
        }],
        matchLabels: { foo: 'bar' }
      },
      name: 'tt1',
    }];
    const namespace = 'ws1';

    expect(util.getTargetMode(targets, namespace)).toBe('advanced');
  });

  it('should return "none" when targets is an empty array', () => {
    const targets: Target[] = [];
    const namespace = 'ws1';

    expect(util.getTargetMode(targets, namespace)).toBe('none');
  });

  it('should return "local" when namespace is "fleet-local" regardless of targets', () => {
    const targets: Target[] = [{ clusterSelector: { matchLabels: { foo: 'true' } } }, { clusterSelector: { matchLabels: { hci: 'true' } } }];
    const namespace = 'fleet-local';

    expect(util.getTargetMode(targets, namespace)).toBe('local');
  });

  it('should return "all" if no specific target type (clusterName, clusterSelector, clusterGroup, clusterGroupSelector) is present', () => {
    const targets = [{ name: 'target1' }];
    const namespace = 'ws1';

    expect(util.getTargetMode(targets, namespace)).toBe('all');
  });

  it('should return "clusters" if multiple targets include only clusterName', () => {
    const targets = [{ clusterName: 'cluster-a' }, { clusterName: 'cluster-b' }];
    const namespace = 'ws1';

    expect(util.getTargetMode(targets, namespace)).toBe('clusters');
  });

  it('should return "clusters" if a mix of clusterName and empty clusterSelector is present', () => {
    const targets = [{ clusterName: 'cluster-c' }, { clusterSelector: {} },
    ];
    const namespace = 'ws1';

    expect(util.getTargetMode(targets, namespace)).toBe('clusters');
  });

  it('should return "clusters" if one target has clusterGroup but others have clusterName or clusterSelector', () => {
    const targets = [{ clusterName: 'cluster-x' }, { clusterGroup: 'my-group' }, { clusterSelector: { matchLabels: { env: 'prod' } } }];
    const namespace = 'ws1';

    expect(util.getTargetMode(targets, namespace)).toBe('clusters');
  });

  it('should return "advanced" if one target has clusterGroupSelector but others have clusterName or clusterSelector', () => {
    const targets = [{ clusterName: 'cluster-x' }, { clusterGroupSelector: {} }, { clusterSelector: { matchLabels: { env: 'prod' } } }];
    const namespace = 'ws1';

    expect(util.getTargetMode(targets, namespace)).toBe('advanced');
  });

  it('should return "all" when targets contain excludeHarvesterRule along with other irrelevant properties', () => {
    const targets = [{
      clusterSelector: {
        matchExpressions: [{
          key:      'provider.cattle.io',
          operator: 'NotIn',
          values:   ['harvester'],
        }],
      },
      name: 'some-other-name'
    }];
    const namespace = 'ws1';

    expect(util.getTargetMode(targets, namespace)).toBe('all');
  });
});

describe('fleet: quacksLikeAHash', () => {
  it.each([
    ['40-char lowercase hex string', 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2', true],
    ['40-char uppercase hex string', 'A1B2C3D4E5F6A1B2C3D4E5F6A1B2C3D4E5F6A1B2', true],
    ['64-char sha256 hex string', 'a'.repeat(64), true],
    ['39-char hex string (too short)', 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1', false],
    ['non-hex characters', 'z1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2', false],
    ['empty string', '', false],
    ['semantic version string', 'v1.2.3', false],
    ['branch name', 'main', false],
  ])('%s', (_desc, input, expected) => {
    expect(FleetUtils.quacksLikeAHash(input)).toBe(expected);
  });
});

describe('fleet: parseSSHUrl', () => {
  it('parses a standard git ssh url', () => {
    const result = FleetUtils.parseSSHUrl('git@github.com:rancher/dashboard.git');

    expect(result).toStrictEqual({ sshUserAndHost: 'git@github.com', repoPath: 'rancher/dashboard' });
  });

  it('handles url with no colon', () => {
    const result = FleetUtils.parseSSHUrl('git@github.com');

    expect(result).toStrictEqual({ sshUserAndHost: 'git@github.com', repoPath: undefined });
  });

  it('handles empty string', () => {
    const result = FleetUtils.parseSSHUrl('');

    expect(result).toStrictEqual({ sshUserAndHost: '', repoPath: undefined });
  });
});

describe('fleet: resourceId', () => {
  it('returns namespace/name when namespace is present', () => {
    expect(FleetUtils.resourceId({
      kind: 'Pod', apiVersion: 'v1', namespace: 'default', name: 'my-pod'
    })).toBe('default/my-pod');
  });

  it('returns only name when namespace is absent', () => {
    expect(FleetUtils.resourceId({
      kind: 'ClusterRole', apiVersion: 'rbac.authorization.k8s.io/v1', name: 'my-role'
    })).toBe('my-role');
  });

  it('returns only name when namespace is empty string', () => {
    expect(FleetUtils.resourceId({
      kind: 'Pod', apiVersion: 'v1', namespace: '', name: 'my-pod'
    })).toBe('my-pod');
  });
});

describe('fleet: resourceType', () => {
  it('returns lowercase kind when apiVersion is v1', () => {
    expect(FleetUtils.resourceType({
      kind: 'Pod', apiVersion: 'v1', name: 'p', state: 'ready'
    })).toBe('pod');
  });

  it('returns lowercase kind when apiVersion is absent', () => {
    expect(FleetUtils.resourceType({
      kind: 'Pod', apiVersion: '', name: 'p', state: 'ready'
    })).toBe('pod');
  });

  it('prefixes group from apiVersion for non-core resources', () => {
    expect(FleetUtils.resourceType({
      kind: 'Deployment', apiVersion: 'apps/v1', name: 'd', state: 'ready'
    })).toBe('apps.deployment');
  });

  it('uses only first segment of apiVersion as group', () => {
    expect(FleetUtils.resourceType({
      kind: 'Certificate', apiVersion: 'cert-manager.io/v1', name: 'c', state: 'ready'
    })).toBe('cert-manager.io.certificate');
  });
});

describe('fleet: bundleDeploymentState', () => {
  const makeDeployment = (overrides: Partial<BundleDeployment> = {}): BundleDeployment => ({
    spec:   { deploymentId: 'dep-1', stagedDeploymentId: 'dep-1' },
    status: {
      appliedDeploymentId: 'dep-1',
      ready:               true,
      nonModified:         true,
      conditions:          [],
    },
    ...overrides,
  });

  it('returns ready when all conditions are nominal', () => {
    expect(FleetUtils.bundleDeploymentState(makeDeployment())).toBe(STATES_ENUM.READY);
  });

  it('returns errapplied when appliedDeploymentId differs and Deployed condition is false', () => {
    const bd = makeDeployment({
      status: {
        appliedDeploymentId: 'dep-0', ready: true, nonModified: true, conditions: []
      }
    });

    expect(FleetUtils.bundleDeploymentState(bd)).toBe(STATES_ENUM.ERR_APPLIED);
  });

  it('returns waitapplied when appliedDeploymentId differs and Deployed condition is true', () => {
    const bd = makeDeployment({
      status: {
        appliedDeploymentId: 'dep-0',
        ready:               true,
        nonModified:         true,
        conditions:          [{ type: 'Deployed', status: 'True' }],
      },
    });

    expect(FleetUtils.bundleDeploymentState(bd)).toBe(STATES_ENUM.WAIT_APPLIED);
  });

  it('returns notready when applied matches but not ready', () => {
    const bd = makeDeployment({
      status: {
        appliedDeploymentId: 'dep-1', ready: false, nonModified: true, conditions: []
      }
    });

    expect(FleetUtils.bundleDeploymentState(bd)).toBe(STATES_ENUM.NOT_READY);
  });

  it('returns outofsync when deploymentId differs from stagedDeploymentId', () => {
    const bd: BundleDeployment = {
      spec:   { deploymentId: 'dep-1', stagedDeploymentId: 'dep-2' },
      status: {
        appliedDeploymentId: 'dep-1',
        ready:               true,
        nonModified:         true,
        conditions:          [],
      },
    };

    expect(FleetUtils.bundleDeploymentState(bd)).toBe(STATES_ENUM.OUT_OF_SYNC);
  });

  it('returns modified when nonModified is false', () => {
    const bd = makeDeployment({
      status: {
        appliedDeploymentId: 'dep-1', ready: true, nonModified: false, conditions: []
      }
    });

    expect(FleetUtils.bundleDeploymentState(bd)).toBe(STATES_ENUM.MODIFIED);
  });
});

describe('fleet: resourcesFromBundleDeploymentStatus', () => {
  it('returns empty array for empty status', () => {
    const result = FleetUtils.resourcesFromBundleDeploymentStatus({} as BundleDeploymentStatus);

    expect(result).toStrictEqual([]);
  });

  it('marks resources as ready when only in status.resources', () => {
    const status: BundleDeploymentStatus = {
      resources: [{
        kind: 'Pod', apiVersion: 'v1', namespace: 'ns', name: 'pod-1'
      }],
      ready:       true,
      nonModified: true,
      conditions:  [],
    };
    const result = FleetUtils.resourcesFromBundleDeploymentStatus(status);

    expect(result).toHaveLength(1);
    expect(result[0].state).toBe(STATES_ENUM.READY);
    expect(result[0].name).toBe('pod-1');
  });

  it('marks resource as missing when in modifiedStatus with missing=true', () => {
    const status: BundleDeploymentStatus = {
      modifiedStatus: [{
        kind: 'Pod', apiVersion: 'v1', namespace: 'ns', name: 'pod-1', missing: true, patch: ''
      }],
      ready:       true,
      nonModified: true,
      conditions:  [],
    };
    const result = FleetUtils.resourcesFromBundleDeploymentStatus(status);

    expect(result).toHaveLength(1);
    expect(result[0].state).toBe(STATES_ENUM.MISSING);
  });

  it('marks resource as orphaned when in modifiedStatus with delete=true', () => {
    const status: BundleDeploymentStatus = {
      modifiedStatus: [{
        kind: 'Pod', apiVersion: 'v1', namespace: 'ns', name: 'pod-1', delete: true, patch: ''
      }],
      ready:       true,
      nonModified: true,
      conditions:  [],
    };
    const result = FleetUtils.resourcesFromBundleDeploymentStatus(status);

    expect(result[0].state).toBe(STATES_ENUM.ORPHANED);
  });

  it('marks resource as modified when in modifiedStatus without missing/delete', () => {
    const status: BundleDeploymentStatus = {
      modifiedStatus: [{
        kind: 'Pod', apiVersion: 'v1', namespace: 'ns', name: 'pod-1', patch: 'diff'
      }],
      ready:       true,
      nonModified: true,
      conditions:  [],
    };
    const result = FleetUtils.resourcesFromBundleDeploymentStatus(status);

    expect(result[0].state).toBe(STATES_ENUM.MODIFIED);
  });

  it('updates state of a resource that appears in both resources and modifiedStatus', () => {
    const status: BundleDeploymentStatus = {
      resources: [{
        kind: 'Pod', apiVersion: 'v1', namespace: 'ns', name: 'pod-1'
      }],
      modifiedStatus: [{
        kind: 'Pod', apiVersion: 'v1', namespace: 'ns', name: 'pod-1', missing: true, patch: ''
      }],
      ready:       true,
      nonModified: true,
      conditions:  [],
    };
    const result = FleetUtils.resourcesFromBundleDeploymentStatus(status);

    expect(result).toHaveLength(1);
    expect(result[0].state).toBe(STATES_ENUM.MISSING);
  });
});

describe('fleet: clusterIdFromBundleDeploymentLabels', () => {
  it('returns namespace/name from labels', () => {
    const labels = {
      [FLEET_LABELS.CLUSTER_NAMESPACE]: 'fleet-default',
      [FLEET_LABELS.CLUSTER]:           'cluster-1',
    };

    expect(FleetUtils.clusterIdFromBundleDeploymentLabels(labels)).toBe('fleet-default/cluster-1');
  });

  it('returns undefined/undefined when labels are absent', () => {
    expect(FleetUtils.clusterIdFromBundleDeploymentLabels(undefined)).toBe('undefined/undefined');
  });
});

describe('fleet: bundleIdFromBundleDeploymentLabels', () => {
  it('returns namespace/name from labels', () => {
    const labels = {
      [FLEET_LABELS.BUNDLE_NAMESPACE]: 'fleet-default',
      [FLEET_LABELS.BUNDLE_NAME]:      'my-bundle',
    };

    expect(FleetUtils.bundleIdFromBundleDeploymentLabels(labels)).toBe('fleet-default/my-bundle');
  });

  it('returns undefined/undefined when labels are absent', () => {
    expect(FleetUtils.bundleIdFromBundleDeploymentLabels(undefined)).toBe('undefined/undefined');
  });
});

describe('fleet: getDashboardStateId', () => {
  it('strips "text-" prefix from stateColor', () => {
    expect(FleetUtils.getDashboardStateId({ stateColor: 'text-error' })).toBe('error');
  });

  it('returns "warning" when stateColor is falsy', () => {
    expect(FleetUtils.getDashboardStateId({ stateColor: '' })).toBe('warning');
  });

  it('returns stateColor unchanged when no "text-" prefix', () => {
    expect(FleetUtils.getDashboardStateId({ stateColor: 'success' })).toBe('success');
  });
});

describe('fleet: getDashboardState', () => {
  it('returns the matching dashboard state for a known stateColor', () => {
    const state = FleetUtils.getDashboardState({ stateColor: 'text-error' }) as { id: string };

    expect(state.id).toBe('error');
  });

  it('returns empty object for an unknown stateColor', () => {
    expect(FleetUtils.getDashboardState({ stateColor: 'text-unknown-state' })).toStrictEqual({});
  });

  it('returns warning state when stateColor is empty', () => {
    const state = FleetUtils.getDashboardState({ stateColor: '' }) as { id: string };

    expect(state.id).toBe('warning');
  });
});
