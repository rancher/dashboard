import { matching, convertSelectorObj } from '@shell/utils/selector';
import isEmpty from 'lodash/isEmpty';
import { escapeHtml } from '@shell/utils/string';
import { FLEET, MANAGEMENT } from '@shell/config/types';
import { FLEET as FLEET_ANNOTATIONS } from '@shell/config/labels-annotations';
import { addObject, addObjects, findBy } from '@shell/utils/array';
import SteveModel from '@shell/plugins/steve/steve-class';
import { mapStateToEnum, primaryDisplayStatusFromCount, STATES_ENUM } from '@shell/plugins/dashboard-store/resource-class';
import FleetUtils from '@shell/utils/fleet';
import { HARVESTER_CONTAINER } from '@shell/store/features';

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

export default class FleetApplication extends SteveModel {
  async getCurrentUser() {
    const user = this.$rootGetters['auth/user'];

    if (user?.id) {
      return user;
    }

    const selfUser = await this.$dispatch('auth/getSelfUser');

    if (selfUser?.canGetUser && selfUser.status?.userID) {
      const user = await this.$dispatch('management/find', {
        type: MANAGEMENT.USER,
        id:   selfUser.status?.userID
      }, { root: true });

      if (user) {
        this.$dispatch('auth/gotUser', user, { root: true });

        return user;
      }
    }

    return {};
  }

  pause() {
    this.spec.paused = true;
    this.save();
  }

  unpause() {
    this.spec.paused = false;
    this.save();
  }

  goToClone() {
    if (this.metadata?.labels?.[FLEET_ANNOTATIONS.CREATED_BY_USER_ID]) {
      delete this.metadata.labels[FLEET_ANNOTATIONS.CREATED_BY_USER_ID];
    }

    super.goToClone();
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

  get targetInfo() {
    const areHarvesterHostsVisible = this.$rootGetters['features/get'](HARVESTER_CONTAINER);
    const mode = FleetUtils.Application.getTargetMode(this.spec.targets || [], this.metadata.namespace, areHarvesterHostsVisible);

    return {
      mode,
      modeDisplay: this.t(`fleet.gitRepo.targetDisplay."${ mode }"`),
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

  get allResourceStatuses() {
    return normalizeStateCounts(this.status?.resourceCounts || {});
  }

  statusResourceCountsForCluster(clusterId) {
    if (!(this.targetClusters || []).some((c) => c.id === clusterId)) {
      return {};
    }

    return this.status?.perClusterResourceCounts?.[clusterId] || { desiredReady: 0 };
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

      if (Object.entries(perClusterState).length === 0) {
        (this.targetClusters || []).forEach((cluster) => {
          acc.push(Object.assign({}, resource, { clusterId: cluster.id, state: resource.state }));
        });
      } else {
        Object.entries(perClusterState).forEach(([state, clusterIds]) => {
          clusterIds.filter((id) => !!clusters[id]).forEach((clusterId) => {
            acc.push(Object.assign({}, resource, { clusterId, state }));
          });
        });
      }

      return acc;
    }, []);

    return resources.map((r) => {
      const { namespace, name, clusterId } = r;
      const type = FleetUtils.resourceType(r);
      const c = clusters[clusterId];

      return {
        key: `${ clusterId }-${ type }-${ namespace }-${ name }`,

        // Needed?
        id: FleetUtils.resourceId(r),
        type,
        clusterId,

        // columns, see FleetResources.vue
        state:       mapStateToEnum(r.state),
        clusterName: c.nameDisplay,
        apiVersion:  r.apiVersion,
        kind:        r.kind,
        name,
        namespace,

        // other properties
        detailLocation: FleetUtils.detailLocation(r, c.metadata.labels[FLEET_ANNOTATIONS.CLUSTER_NAME]),
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

  get meta() {
    return this.currentRoute()?.meta || {};
  }

  get _detailLocation() {
    return {
      ...super._detailLocation,
      name: this.meta.detailLocation || super._detailLocation.name
    };
  }

  get doneOverride() {
    return {
      ...super.listLocation,
      name: this.meta.doneOverride || super.listLocation.name
    };
  }

  get doneRoute() {
    return this.doneOverride?.name;
  }

  get parentNameOverride() {
    return this.$rootGetters['i18n/t'](`typeLabel."${ FLEET.APPLICATION }"`, { count: 1 })?.trim();
  }
}
