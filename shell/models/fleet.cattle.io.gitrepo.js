import { convert, matching, convertSelectorObj } from '@shell/utils/selector';
import jsyaml from 'js-yaml';
import isEmpty from 'lodash/isEmpty';
import { escapeHtml } from '@shell/utils/string';
import { FLEET, MANAGEMENT } from '@shell/config/types';
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
  if (isEmpty(data)) {
    return {
      total:  0,
      states: {},
    };
  }
  const { desiredReady, ...rest } = data ;
  const states = Object.entries(rest).reduce((res, [key, value]) => {
    res[mapStateToEnum(key)] = value;

    return res;
  }, {});

  return {
    total: desiredReady,
    states,
  };
}

export default class GitRepo extends SteveModel {
  get currentUser() {
    return this.$rootGetters['auth/v3User'] || {};
  }

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
      label:    this.t('fleet.gitRepo.actions.pause.label'),
      icon:     'icon icon-pause',
      bulkable: true,
      enabled:  !!this.links.update && !this.spec?.paused
    });

    insertAt(out, 1, {
      action:   'unpause',
      label:    this.t('fleet.gitRepo.actions.unpause.label'),
      icon:     'icon icon-play',
      bulkable: true,
      enabled:  !!this.links.update && this.spec?.paused === true
    });

    insertAt(out, 2, {
      action:   'enablePolling',
      label:    this.t('fleet.gitRepo.actions.enablePolling.label'),
      icon:     'icon icon-endpoints_connected',
      bulkable: true,
      enabled:  !!this.links.update && !!this.spec?.disablePolling
    });

    insertAt(out, 3, {
      action:   'disablePolling',
      label:    this.t('fleet.gitRepo.actions.disablePolling.label'),
      icon:     'icon icon-endpoints_disconnected',
      bulkable: true,
      enabled:  !!this.links.update && !this.spec?.disablePolling
    });

    insertAt(out, 4, {
      action:     'forceUpdate',
      label:      this.t('fleet.gitRepo.actions.forceUpdate.label'),
      icon:       'icon icon-refresh',
      bulkable:   true,
      bulkAction: 'forceUpdateBulk',
      enabled:    !!this.links.update
    });

    insertAt(out, 5, { divider: true });

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

  enablePolling() {
    this.spec.disablePolling = false;
    this.save();
  }

  disablePolling() {
    this.spec.disablePolling = true;
    this.save();
  }

  goToClone() {
    if (this.metadata?.labels?.[FLEET_ANNOTATIONS.CREATED_BY_USER_ID]) {
      delete this.metadata.labels[FLEET_ANNOTATIONS.CREATED_BY_USER_ID];
    }

    if (this.metadata?.labels?.[FLEET_ANNOTATIONS.CREATED_BY_USER_NAME]) {
      delete this.metadata.labels[FLEET_ANNOTATIONS.CREATED_BY_USER_NAME];
    }

    super.goToClone();
  }

  forceUpdate(resources = [this]) {
    this.$dispatch('promptModal', {
      componentProps: { repositories: resources },
      component:      'GitRepoForceUpdateDialog'
    });
  }

  forceUpdateBulk(resources) {
    this.$dispatch('promptModal', {
      componentProps: { repositories: resources },
      component:      'GitRepoForceUpdateDialog'
    });
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
    const match = (this.spec.repo || '').match(/^https?:\/\/github\.com\/(.*?)(\.git)?\/*$/);

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
    let repo = this.spec.repo || '';

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
    return this.$getters['matching'](FLEET.BUNDLE, { [FLEET_ANNOTATIONS.REPO_NAME]: this.name }, this.namespace);
  }

  get bundleDeployments() {
    return this.$getters['matching'](FLEET.BUNDLE_DEPLOYMENT, { [FLEET_ANNOTATIONS.REPO_NAME]: this.name });
  }

  get allBundlesStatuses() {
    return this.bundles.reduce((acc, bundle) => {
      if (isEmpty(bundle.status?.summary)) {
        return acc;
      }

      const { nonReadyResources, ...summary } = bundle.status?.summary;

      const bdCounts = normalizeStateCounts(summary);
      const state = primaryDisplayStatusFromCount(bdCounts.states);

      if (!acc.states[state]) {
        acc.states[state] = 0;
      }
      acc.states[state]++;
      acc.total++;

      return acc;
    }, { total: 0, states: { [STATES_ENUM.READY]: 0 } } );
  }

  get allResourceStatuses() {
    return normalizeStateCounts(this.status?.resourceCounts || {});
  }

  statusResourceCountsForCluster(clusterId) {
    if (!this.targetClusters.some((c) => c.id === clusterId)) {
      return {};
    }

    return this.status?.perClusterResourceCounts[clusterId] || { desiredReady: 0 };
  }

  get resourcesStatuses() {
    if (isEmpty(this.status?.resources)) {
      return [];
    }

    const clusters = (this.targetClusters || []).reduce((res, c) => {
      res[c.id] = c;

      return res;
    }, {});
    const resources = this.status?.resources?.reduce((acc, resourceInfo) => {
      const { perClusterState, ...resource } = resourceInfo;

      Object.entries(perClusterState).forEach(([state, clusterIds]) => {
        clusterIds.filter((id) => !!clusters[id]).forEach((clusterId) => {
          acc.push(Object.assign({}, resource, { clusterId, state }));
        });
      });

      return acc;
    }, []);

    return resources.map((r) => {
      const {
        namespace, name, clusterId, state
      } = r;
      const id = FleetUtils.resourceId(r);
      const type = FleetUtils.resourceType(r);
      const c = clusters[clusterId];

      const color = colorForState(state).replace('text-', 'bg-');
      const display = stateDisplay(state);

      const detailLocation = state !== STATES_ENUM.MISSING ? {
        name:   `c-cluster-product-resource${ r.namespace ? '-namespace' : '' }-id`,
        params: {
          product:  NAME,
          cluster:  c.metadata.labels[FLEET_ANNOTATIONS.CLUSTER_NAME], // explorer uses the "management" Cluster name, which differs from the Fleet Cluster name
          resource: type,
          namespace,
          id:       name,
        }
      } : undefined;

      const key = `${ clusterId }-${ type }-${ namespace }-${ name }`;

      return {
        key,
        tableKey: key,

        // Needed?
        id,
        type,
        clusterId,

        // columns, see FleetResources.vue
        state:       mapStateToEnum(state),
        clusterName: c.nameDisplay,
        apiVersion:  r.apiVersion,
        kind:        r.kind,
        name:        r.name,
        namespace:   r.namespace,

        // other properties
        stateBackground: color,
        stateDisplay:    display,
        stateSort:       stateSort(color, display),
        detailLocation,
      };
    });
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

  get authorId() {
    return this.metadata?.labels?.[FLEET_ANNOTATIONS.CREATED_BY_USER_ID];
  }

  get author() {
    if (this.authorId) {
      return this.$rootGetters['management/byId'](MANAGEMENT.USER, this.authorId);
    }

    return null;
  }

  get createdBy() {
    const displayName = this.metadata?.labels?.[FLEET_ANNOTATIONS.CREATED_BY_USER_NAME];

    if (!displayName) {
      return null;
    }

    return {
      displayName,
      location: !this.author ? null : {
        name:   'c-cluster-product-resource-id',
        params: {
          cluster:  '_',
          product:  'auth',
          resource: MANAGEMENT.USER,
          id:       this.author.id,
        }
      }
    };
  }

  get showCreatedBy() {
    return !!this.createdBy;
  }
}
