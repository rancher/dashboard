import Vue from 'vue';
import { convert, matching, convertSelectorObj } from '@shell/utils/selector';
import jsyaml from 'js-yaml';
import { escapeHtml, randomStr } from '@shell/utils/string';
import { FLEET } from '@shell/config/types';
import { FLEET as FLEET_ANNOTATIONS } from '@shell/config/labels-annotations';
import { addObject, addObjects, findBy, insertAt } from '@shell/utils/array';
import { set } from '@shell/utils/object';
import SteveModel from '@shell/plugins/steve/steve-class';
import {
  STATES_ENUM, colorForState, mapStateToEnum, primaryDisplayStatusFromCount, stateDisplay, stateSort
} from '@shell/plugins/dashboard-store/resource-class';
import { NAME } from '@shell/config/product/explorer';

function quacksLikeAHash(str) {
  if (str.match(/^[a-f0-9]{40,}$/i)) {
    return true;
  }

  return false;
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

    Vue.set(spec, 'correctDrift', { enabled: false });

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

  get bundlesReady() {
    if (this.bundles && this.bundles.length) {
      return this.bundles.filter((bundle) => bundle.state === 'active');
    }

    return 0;
  }

  get bundleDeployments() {
    const bds = this.$getters['all'](FLEET.BUNDLE_DEPLOYMENT);

    return bds.filter((bd) => bd.metadata?.labels?.['fleet.cattle.io/repo-name'] === this.name);
  }

  get resourcesStatuses() {
    const clusters = this.targetClusters || [];
    const resources = this.status?.resources || [];
    const conditions = this.status?.conditions || [];

    const out = [];

    for (const c of clusters) {
      const clusterBundleDeploymentResources = this.bundleDeployments
        .find((bd) => bd.metadata?.labels?.[FLEET_ANNOTATIONS.CLUSTER] === c.metadata.name)
        ?.status?.resources || [];

      resources.forEach((r, i) => {
        let namespacedName = r.name;

        if (r.namespace) {
          namespacedName = `${ r.namespace }:${ r.name }`;
        }

        let state = r.state;
        const perEntry = r.perClusterState?.find((x) => x.clusterId === c.id);
        const tooMany = r.perClusterState?.length >= 10 || false;

        if (perEntry) {
          state = perEntry.state;
        } else if (tooMany) {
          state = STATES_ENUM.UNKNOWN;
        } else {
          state = STATES_ENUM.READY;
        }

        const color = colorForState(state).replace('text-', 'bg-');
        const display = stateDisplay(state);

        const detailLocation = {
          name:   `c-cluster-product-resource${ r.namespace ? '-namespace' : '' }-id`,
          params: {
            product:   NAME,
            cluster:   c.metadata.labels[FLEET_ANNOTATIONS.CLUSTER_NAME],
            resource:  r.type,
            namespace: r.namespace,
            id:        r.name,
          }
        };

        out.push({
          key:                    `${ r.id }-${ c.id }-${ r.type }-${ r.namespace }-${ r.name }`,
          tableKey:               `${ r.id }-${ c.id }-${ r.type }-${ r.namespace }-${ r.name }-${ randomStr(8) }`,
          kind:                   r.kind,
          apiVersion:             r.apiVersion,
          type:                   r.type,
          id:                     r.id,
          namespace:              r.namespace,
          name:                   r.name,
          clusterId:              c.id,
          clusterLabel:           c.metadata.labels[FLEET_ANNOTATIONS.CLUSTER_NAME],
          clusterName:            c.nameDisplay,
          state:                  mapStateToEnum(state),
          stateBackground:        color,
          stateDisplay:           display,
          stateSort:              stateSort(color, display),
          namespacedName,
          detailLocation,
          conditions:             conditions[i],
          bundleDeploymentStatus: clusterBundleDeploymentResources?.[i],
          creationTimestamp:      clusterBundleDeploymentResources?.[i]?.createdAt
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

  get clusterResourceStatus() {
    const clusterStatuses = this.resourcesStatuses.reduce((prev, curr) => {
      const { clusterId, clusterLabel } = curr;

      const state = curr.state;

      if (!prev[clusterId]) {
        prev[clusterId] = {
          clusterLabel,
          resourceCounts: { [state]: 0, desiredReady: 0 }

        };
      }

      if (!prev[clusterId].resourceCounts[state]) {
        prev[clusterId].resourceCounts[state] = 0;
      }

      prev[clusterId].resourceCounts[state] += 1;
      prev[clusterId].resourceCounts.desiredReady += 1;

      return prev;
    }, {});

    const values = Object.keys(clusterStatuses).map((key) => {
      const { clusterLabel, resourceCounts } = clusterStatuses[key];

      return {
        clusterId: key,
        clusterLabel, // FLEET LABEL
        status:    {
          displayStatus:  primaryDisplayStatusFromCount(resourceCounts),
          resourceCounts: { ...resourceCounts }
        }
      };
    });

    return values;
  }

  get clustersList() {
    return this.$getters['all'](FLEET.CLUSTER);
  }
}
