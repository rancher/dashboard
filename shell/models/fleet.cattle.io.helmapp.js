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

export const SOURCE_TYPE = {
  REPO:    'repo',
  TARBALL: 'tarball',
  OCI:     'oci',
};

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

export default class HelmApp extends SteveModel {
  applyDefaults() {
    const spec = this.spec || {};
    const meta = this.metadata || {};

    meta.namespace = this.$rootGetters['workspace'];

    spec.helm = spec.helm || {};

    spec['correctDrift'] = { enabled: false };

    set(this, 'spec', spec);
    set(this, 'metadata', meta);
  }

  get _availableActions() {
    const out = super._availableActions;

    insertAt(out, 0, {
      action:   'pause',
      label:    this.t('fleet.helmApp.actions.pause.label'),
      icon:     'icon icon-pause',
      bulkable: true,
      enabled:  !!this.links.update && !this.spec?.paused
    });

    insertAt(out, 1, {
      action:   'unpause',
      label:    this.t('fleet.helmApp.actions.unpause.label'),
      icon:     'icon icon-play',
      bulkable: true,
      enabled:  !!this.links.update && this.spec?.paused === true
    });

    insertAt(out, 2, {
      action:     'forceUpdate',
      label:      this.t('fleet.helmApp.actions.forceUpdate.label'),
      icon:       'icon icon-refresh',
      bulkable:   true,
      bulkAction: 'forceUpdateBulk',
      enabled:    !!this.links.update
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

  forceUpdate(resources = [this]) {
    this.$dispatch('promptModal', {
      componentProps: { helmApps: resources },
      component:      'HelmAppForceUpdateDialog'
    });
  }

  forceUpdateBulk(resources) {
    this.$dispatch('promptModal', {
      componentProps: { helmApps: resources },
      component:      'HelmAppForceUpdateDialog'
    });
  }

  get sourceType() {
    let out = SOURCE_TYPE.REPO;

    if (this.spec.helm?.repo) {
      if (this.spec.helm.repo.startsWith('oci://')) {
        out = SOURCE_TYPE.OCI;
      }
    } else if (this.spec.helm?.chart) {
      if (this.spec.helm.chart.startsWith('https://')) {
        out = SOURCE_TYPE.TARBALL;
      }
    }

    return out;
  }

  get source() {
    let value = '';

    switch (this.sourceType) {
    case SOURCE_TYPE.TARBALL:
      value = this.spec.helm.chart || '';
      break;
    default:
      value = this.spec.helm.repo || '';
    }

    return {
      value,
      display: value,
      icon:    'icon icon-application'
    };
  }

  get sourceSub() {
    let chart = '';
    let version = '';

    if (this.sourceType !== SOURCE_TYPE.TARBALL) {
      chart = this.spec.helm.chart;
      version = this.spec.helm.version;
    }

    const value = chart?.concat(':', version);

    return {
      value,
      display: value,
    };
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
      modeDisplay: this.t(`fleet.helmApp.targetDisplay."${ mode }"`),
      cluster,
      clusterGroup,
      advanced
    };
  }

  get _detailLocation() {
    if (this.currentRouter().currentRoute.value.path.includes('/fleet/application')) {
      return {
        ...super._detailLocation,
        name: 'c-cluster-fleet-application-resource-namespace-id'
      };
    }

    return super._detailLocation;
  }

  get doneOverride() {
    if (this.currentRouter().currentRoute.value.path.includes('/fleet/application')) {
      return {
        ...super.listLocation,
        name: 'c-cluster-fleet-application'
      };
    }

    return super.listLocation;
  }

  get parentNameOverride() {
    if (this.currentRouter().currentRoute.value.path.includes('/fleet/application')) {
      return this.$rootGetters['i18n/t'](`typeLabel."${ FLEET.APPLICATION }"`, { count: 1 })?.trim();
    }

    return null;
  }

  get bundles() {
    return this.$getters['matching'](FLEET.BUNDLE, { [FLEET_ANNOTATIONS.HELM_NAME]: this.name }, this.namespace);
  }

  get bundleDeployments() {
    return this.$getters['matching'](FLEET.BUNDLE_DEPLOYMENT, { [FLEET_ANNOTATIONS.HELM_NAME]: this.name });
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

  get readyClusters() {
    return this.status?.readyClusters || 0;
  }
}
