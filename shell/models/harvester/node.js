import pickBy from 'lodash/pickBy';
import { HCI, LONGHORN, POD } from '@shell/config/types';
import { HCI as HCI_ANNOTATIONS } from '@shell/config/labels-annotations';
import { clone } from '@shell/utils/object';
import findLast from 'lodash/findLast';
import { colorForState, stateDisplay } from '@shell//plugins/core-store/resource-class';
import SteveModel from '@shell/plugins/steve/steve-class';
import { parseSi } from '@shell/utils/units';

export default class HciNode extends SteveModel {
  get _availableActions() {
    const cordon = {
      action:     'cordon',
      enabled:    this.hasAction('cordon') && !this.isCordoned,
      icon:       'icon icon-fw icon-pause',
      label:      this.t('harvester.action.cordon'),
      total:      1,
    };

    const uncordon = {
      action:     'uncordon',
      enabled:    this.hasAction('uncordon'),
      icon:       'icon icon-fw icon-play',
      label:      this.t('harvester.action.uncordon'),
      total:      1,
    };

    const enableMaintenance = {
      action:     'enableMaintenanceMode',
      enabled:    this.hasAction('enableMaintenanceMode'),
      icon:       'icon icon-fw icon-unlock',
      label:      this.t('harvester.action.enableMaintenance'),
      total:      1
    };

    const disableMaintenance = {
      action:     'disableMaintenanceMode',
      enabled:    this.hasAction('disableMaintenanceMode'),
      icon:       'icon icon-fw icon-lock',
      label:      this.t('harvester.action.disableMaintenance'),
      total:      1
    };

    return [
      cordon,
      uncordon,
      enableMaintenance,
      disableMaintenance,
      ...super._availableActions
    ];
  }

  get confirmRemove() {
    return true;
  }

  get filteredSystemLabels() {
    const reg = /(k3s|kubernetes|kubevirt|harvesterhci|k3os)+\.io/;

    return pickBy(this.labels, (value, key) => {
      return !reg.test(key);
    });
  }

  get nameDisplay() {
    return this.metadata?.annotations?.[HCI_ANNOTATIONS.HOST_CUSTOM_NAME] || this.name;
  }

  get stateDisplay() {
    if (this.isEnteringMaintenance) {
      return 'Entering maintenance mode';
    }

    if (this.isMaintenance) {
      return 'Maintenance mode';
    }

    if (this.isCordoned ) {
      return 'Cordoned';
    }

    return stateDisplay(this.state);
  }

  get stateBackground() {
    return colorForState(this.stateDisplay, this.stateObj?.error, this.stateObj?.transitioning).replace('text-', 'bg-');
  }

  get detailLocation() {
    const detailLocation = clone(this._detailLocation);

    detailLocation.params.resource = HCI.HOST;

    return detailLocation;
  }

  get doneOverride() {
    const detailLocation = clone(this._detailLocation);

    delete detailLocation.params.namespace;
    delete detailLocation.params.id;
    detailLocation.params.resource = HCI.HOST;
    detailLocation.name = 'c-cluster-product-resource';

    return detailLocation;
  }

  get parentNameOverride() {
    return this.$rootGetters['i18n/t'](`typeLabel."${ HCI.HOST }"`, { count: 1 })?.trim();
  }

  get parentLocationOverride() {
    return this.doneOverride;
  }

  get internalIp() {
    const addresses = this.status?.addresses || [];

    return findLast(addresses, address => address.type === 'InternalIP')?.address;
  }

  get isMaster() {
    return this.metadata?.labels?.[HCI_ANNOTATIONS.NODE_ROLE_MASTER] !== undefined || this.metadata?.labels?.[HCI_ANNOTATIONS.NODE_ROLE_CONTROL_PLANE] !== undefined;
  }

  cordon() {
    this.doAction('cordon', {});
  }

  uncordon() {
    this.doAction('uncordon', {});
  }

  enableMaintenanceMode(resources = this) {
    this.$dispatch('promptModal', {
      resources,
      component: 'harvester/MaintenanceDialog'
    });
  }

  disableMaintenanceMode() {
    this.doAction('disableMaintenanceMode', {});
  }

  get isUnSchedulable() {
    return this.metadata?.labels?.[HCI_ANNOTATIONS.NODE_SCHEDULABLE] === 'false' || this.spec.unschedulable;
  }

  get isMigratable() {
    const states = ['in-progress', 'unavailable'];

    return !this.metadata?.annotations?.[HCI_ANNOTATIONS.MAINTENANCE_STATUS] && !this.isUnSchedulable && !states.includes(this.state);
  }

  get isCordoned() {
    return this.isUnSchedulable;
  }

  get isEnteringMaintenance() {
    return this.metadata?.annotations?.[HCI_ANNOTATIONS.MAINTENANCE_STATUS] === 'running';
  }

  get isMaintenance() {
    return this.metadata?.annotations?.[HCI_ANNOTATIONS.MAINTENANCE_STATUS] === 'completed';
  }

  get longhornDisks() {
    const inStore = this.$rootGetters['currentProduct'].inStore;
    const longhornNode = this.$rootGetters[`${ inStore }/byId`](LONGHORN.NODES, `longhorn-system/${ this.id }`);
    const diskStatus = longhornNode?.status?.diskStatus || {};
    const diskSpec = longhornNode?.spec?.disks || {};

    const longhornDisks = Object.keys(diskStatus).map((key) => {
      return {
        ...diskSpec[key],
        ...diskStatus[key],
        name:                  key,
        storageReserved:       diskSpec[key]?.storageReserved,
        storageAvailable:      diskStatus[key]?.storageAvailable,
        storageMaximum:        diskStatus[key]?.storageMaximum,
        storageScheduled:      diskStatus[key]?.storageScheduled,
        readyCondiction:       diskStatus[key]?.conditions?.Ready || {},
        schedulableCondiction: diskStatus[key]?.conditions?.Schedulable || {},
      };
    });

    return longhornDisks;
  }

  get pods() {
    const inStore = this.$rootGetters['currentProduct'].inStore;
    const pods = this.$rootGetters[`${ inStore }/all`](POD) || [];

    return pods.filter(p => p?.spec?.nodeName === this.id && p?.metadata?.name !== 'removing');
  }

  get cpuReserved() {
    const out = this.pods.reduce((sum, pod) => {
      const containers = pod?.spec?.containers || [];

      const containerCpuReserved = containers.reduce((sum, c) => {
        sum += parseSi(c?.resources?.requests?.cpu || '0m');

        return sum;
      }, 0);

      sum += containerCpuReserved;

      return sum;
    }, 0);

    return out;
  }

  get memoryReserved() {
    const out = this.pods.reduce((sum, pod) => {
      const containers = pod?.spec?.containers || [];

      const containerMemoryReserved = containers.reduce((sum, c) => {
        sum += parseSi(c?.resources?.requests?.memory || '0m', { increment: 1024 });

        return sum;
      }, 0);

      sum += containerMemoryReserved;

      return sum;
    }, 0);

    return out;
  }
}
