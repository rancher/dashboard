import { convert, matching, convertSelectorObj } from '@shell/utils/selector';
import jsyaml from 'js-yaml';
import { escapeHtml } from '@shell/utils/string';
import { FLEET } from '@shell/config/types';
import { FLEET as FLEET_ANNOTATIONS } from '@shell/config/labels-annotations';
import { addObject, addObjects, findBy, insertAt } from '@shell/utils/array';
import { set } from '@shell/utils/object';
import SteveModel from '@shell/plugins/steve/steve-class';
import {
  colorForState, mapStateToEnum, primaryDisplayStatusFromCount, stateDisplay, STATES_ENUM, stateSort,
} from '@shell/plugins/dashboard-store/resource-class';
import { NAME } from '@shell/config/product/explorer';
import FleetUtils from '@shell/utils/fleet';

function quacksLikeAHash(str) {
  if (str.match(/^[a-f0-9]{40,}$/i)) {
    return true;
  }

  return false;
}

function normalizeStateCounts(data) {
  if (!data || data === {}) {
    return {
      total:  0,
      states: {},
    };
  }
  const { desiredReady, ...rest } = data ;

  return {
    total:  desiredReady,
    states: rest,
  };
}

export default class GitRepo extends SteveModel {
  applyDefaults() {
    const spec = this.spec || {};
    const meta = this.metadata || {};

    meta.namespace = this.$rootGetters['workspace'];

    spec.repo = spec.repo || '';

    if (!spec.branch && !spec.revision) {
      spec.branch = 'master';
    }

    spec.paths = spec.paths || [];
    spec.clientSecretName = spec.clientSecretName || null;

    spec['correctDrift'] = { enabled: false };

    set(this, 'spec', spec);
    set(this, 'metadata', meta);
  }

  get _availableActions() {
    const out = super._availableActions;

    insertAt(out, 0, {
      action:   'pause',
      label:    'Pause',
      icon:     'icon icon-pause',
      bulkable: true,
      enabled:  !!this.links.update && !this.spec?.paused
    });

    insertAt(out, 1, {
      action:   'unpause',
      label:    'Unpause',
      icon:     'icon icon-play',
      bulkable: true,
      enabled:  !!this.links.update && this.spec?.paused === true
    });

    insertAt(out, 2, {
      action:   'forceUpdate',
      label:    'Force Update',
      icon:     'icon icon-refresh',
      bulkable: true,
      enabled:  !!this.links.update
    });

    insertAt(out, 3, { divider: true });

    return out;
  }

  pause() {
    this.spec.paused = true;
    this.save();
  }

  unpause() {
    this.spec.paused = false;
    this.save();
  }

  forceUpdate() {
    const now = this.spec.forceSyncGeneration || 1;

    this.spec.forceSyncGeneration = now + 1;
    this.save();
  }

  get state() {
    if (this.spec?.paused === true) {
      return 'paused';
    }

    return this.metadata?.state?.name || 'unknown';
  }

  get targetClusters() {
    const workspace = this.$getters['byId'](FLEET.WORKSPACE, this.metadata.namespace);
    const clusters = workspace?.clusters || [];
    const groups = workspace?.clusterGroups || [];

    if (workspace?.id === 'fleet-local') {
      // should we be getting the clusters from workspace.clusters instead of having to rely on the groups,
      // which takes an additional request to be done on the Fleet dashboard screen?
      const local = findBy(groups, 'id', 'fleet-local/default');

      if (local) {
        return local.targetClusters;
      }

      return [];
    }

    if (!this.spec.targets) {
      return [];
    }

    const out = [];

    for (const tgt of this.spec.targets) {
      if (tgt.clusterName) {
        const cluster = findBy(clusters, 'metadata.name', tgt.clusterName);

        if (cluster) {
          addObject(out, cluster);
        }
      } else if (tgt.clusterGroup) {
        const group = findBy(groups, {
          'metadata.namespace': this.metadata.namespace,
          'metadata.name':      tgt.clusterGroup,
        });

        if (group) {
          addObjects(out, group.targetClusters);
        }
      } else if (tgt.clusterGroupSelector) {
        const expressions = convertSelectorObj(tgt.clusterGroupSelector);
        const matchingGroups = matching(groups, expressions);

        for (const group of matchingGroups) {
          addObjects(out, group.targetClusters);
        }
      } else if (tgt.clusterSelector) {
        const expressions = convertSelectorObj(tgt.clusterSelector);
        const matchingClusters = matching(clusters, expressions);

        addObjects(out, matchingClusters);
      }
    }

    return out;
  }

  get github() {
    const match = this.spec.repo.match(/^https?:\/\/github\.com\/(.*?)(\.git)?\/*$/);

    if (match) {
      return match[1];
    }

    return false;
  }

  get repoIcon() {
    if (this.github) {
      return 'icon icon-github';
    }

    return '';
  }

  get repoDisplay() {
    let repo = this.spec.repo;

    if (!repo) {
      return null;
    }

    repo = repo.replace(/.git$/, '');
    repo = repo.replace(/^https:\/\//, '');
    repo = repo.replace(/\/+$/, '');

    if (this.github) {
      return this.github;
    }

    return repo;
  }

  get commitDisplay() {
    const spec = this.spec;
    const hash = this.status?.commit?.substr(0, 7);

    if (!spec || !spec.repo) {
      return null;
    }

    if (spec.revision && quacksLikeAHash(spec.revision)) {
      return spec.revision.substr(0, 7);
    } else if (spec.revision) {
      return spec.revision;
    } else if (spec.branch) {
      return spec.branch + (hash ? ` @ ${ hash }` : '');
    }

    return hash;
  }

  get targetInfo() {
    let mode = null;
    let cluster = null;
    let clusterGroup = null;
    let advanced = null;

    const targets = this.spec.targets || [];

    advanced = jsyaml.dump(targets);

    if (advanced === '[]\n') {
      advanced = `# - name:
#  clusterSelector:
#    matchLabels:
#     foo: bar
#    matchExpressions:
#     - key: foo
#       op: In
#       values: [bar, baz]
#  clusterGroup: foo
#  clusterGroupSelector:
#    matchLabels:
#     foo: bar
#    matchExpressions:
#     - key: foo
#       op: In
#       values: [bar, baz]
`;
    }

    if (this.metadata.namespace === 'fleet-local') {
      mode = 'local';
    } else if (!targets.length) {
      mode = 'none';
    } else if (targets.length === 1) {
      const target = targets[0];

      if (Object.keys(target).length > 1) {
        // There are multiple properties in a single target, so use the 'advanced' mode
        // (otherwise any existing content is nuked for what we provide)
        mode = 'advanced';
      } else if (target.clusterGroup) {
        clusterGroup = target.clusterGroup;

        if (!mode) {
          mode = 'clusterGroup';
        }
      } else if (target.clusterName) {
        mode = 'cluster';
        cluster = target.clusterName;
      } else if (target.clusterSelector) {
        if (Object.keys(target.clusterSelector).length === 0) {
          mode = 'all';
        } else {
          const expressions = convert(target.clusterSelector.matchLabels, target.clusterSelector.matchExpressions);

          if (expressions.length === 1 &&
            expressions[0].key === FLEET_ANNOTATIONS.CLUSTER_NAME &&
            expressions[0].operator === 'In' &&
            expressions[0].values.length === 1
          ) {
            cluster = expressions[0].values[0];
            if (!mode) {
              mode = 'cluster';
            }
          }
        }
      }
    }

    if (!mode) {
      mode = 'advanced';
    }

    return {
      mode,
      modeDisplay: this.t(`fleet.gitRepo.targetDisplay."${ mode }"`),
      cluster,
      clusterGroup,
      advanced
    };
  }

  get groupByLabel() {
    const name = this.metadata.namespace;

    if (name) {
      return this.$rootGetters['i18n/t']('resourceTable.groupLabel.workspace', { name: escapeHtml(name) });
    } else {
      return this.$rootGetters['i18n/t']('resourceTable.groupLabel.notInAWorkspace');
    }
  }

  get bundles() {
    const all = this.$getters['all'](FLEET.BUNDLE);

    return all.filter((bundle) => bundle.repoName === this.name &&
      bundle.namespace === this.namespace &&
      bundle.namespacedName.startsWith(`${ this.namespace }:${ this.name }`));
  }

  get bundleDeployments() {
    const bds = this.$getters['all'](FLEET.BUNDLE_DEPLOYMENT);

    return bds.filter((bd) => bd.metadata?.labels?.['fleet.cattle.io/repo-name'] === this.name);
  }

  get allBundlesStatuses() {
    const { nonReadyResources, ...bundlesSummary } = this.status?.summary || {};

    return normalizeStateCounts(bundlesSummary);
  }

  get allResourceStatuses() {
    return normalizeStateCounts(this.status?.resourceCounts || {});
  }

  statusResourceCountsForCluster(clusterId) {
    if (!this.targetClusters.some((c) => c.id === clusterId)) {
      return {};
    }

    return this.bundleDeployments
      .filter((bd) => FleetUtils.clusterIdFromBundleDeploymentLabels(bd.metadata?.labels) === clusterId)
      .map((bd) => FleetUtils.resourcesFromBundleDeploymentStatus(bd.status))
      .flat()
      .map((r) => r.state)
      .reduce((prev, state) => {
        if (!prev[state]) {
          prev[state] = 0;
        }
        prev[state]++;
        prev.desiredReady++;

        return prev;
      }, { desiredReady: 0 });
  }

  get resourcesStatuses() {
    const bundleDeployments = this.bundleDeployments || [];
    const clusters = (this.targetClusters || []).reduce((res, c) => {
      res[c.id] = c;

      return res;
    }, {});

    const out = [];

    for (const bd of bundleDeployments) {
      const clusterId = FleetUtils.clusterIdFromBundleDeploymentLabels(bd.metadata?.labels);
      const c = clusters[clusterId];

      if (!c) {
        continue;
      }

      const resources = FleetUtils.resourcesFromBundleDeploymentStatus(bd.status);

      resources.forEach((r) => {
        const id = FleetUtils.resourceId(r);
        const type = FleetUtils.resourceType(r);
        const state = r.state;

        const color = colorForState(state).replace('text-', 'bg-');
        const display = stateDisplay(state);

        const detailLocation = {
          name:   `c-cluster-product-resource${ r.namespace ? '-namespace' : '' }-id`,
          params: {
            product:   NAME,
            cluster:   c.metadata.labels[FLEET_ANNOTATIONS.CLUSTER_NAME], // explorer uses the "management" Cluster name, which differs from the Fleet Cluster name
            resource:  type,
            namespace: r.namespace,
            id:        r.name,
          }
        };

        const key = `${ c.id }-${ type }-${ r.namespace }-${ r.name }`;

        out.push({
          key,
          tableKey: key,

          // Needed?
          id,
          type,
          clusterId: c.id,

          // columns, see FleetResources.vue
          state:             mapStateToEnum(state),
          clusterName:       c.nameDisplay,
          apiVersion:        r.apiVersion,
          kind:              r.kind,
          name:              r.name,
          namespace:         r.namespace,
          creationTimestamp: r.createdAt,

          // other properties
          stateBackground: color,
          stateDisplay:    display,
          stateSort:       stateSort(color, display),
          detailLocation,
        });
      });
    }

    return out;
  }

  get clusterInfo() {
    const ready = this.status?.readyClusters || 0;
    const total = this.status?.desiredReadyClusters || 0;

    return {
      ready,
      unready: total - ready,
      total,
    };
  }

  clusterState(clusterId) {
    const resourceCounts = this.statusResourceCountsForCluster(clusterId);

    return primaryDisplayStatusFromCount(resourceCounts) || STATES_ENUM.ACTIVE;
  }

  get clustersList() {
    return this.$getters['all'](FLEET.CLUSTER);
  }
}
