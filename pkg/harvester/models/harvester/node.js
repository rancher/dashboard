import pickBy from 'lodash/pickBy';
import { LONGHORN, POD, NODE } from '@shell/config/types';
import { HCI } from '../../types';
import { HCI as HCI_ANNOTATIONS } from '@/pkg/harvester/config/labels-annotations';
import { clone } from '@shell/utils/object';
import findLast from 'lodash/findLast';
import {
  colorForState,
  stateDisplay
} from '@shell/plugins/dashboard-store/resource-class';
import { parseSi } from '@shell/utils/units';
import HarvesterResource from '../harvester';
import { PRODUCT_NAME as HARVESTER_PRODUCT } from '../../config/harvester';
import { findBy } from '@shell/utils/array';

const ALLOW_SYSTEM_LABEL_KEYS = [
  'topology.kubernetes.io/zone',
  'topology.kubernetes.io/region',
];

export default class HciNode extends HarvesterResource {
  get _availableActions() {
    const cordon = {
      action:  'cordon',
      enabled: this.hasAction('cordon') && !this.isCordoned,
      icon:    'icon icon-fw icon-pause',
      label:   this.t('harvester.action.cordon'),
      total:   1
    };

    const uncordon = {
      action:  'uncordon',
      enabled: this.hasAction('uncordon'),
      icon:    'icon icon-fw icon-play',
      label:   this.t('harvester.action.uncordon'),
      total:   1
    };

    const enableMaintenance = {
      action:  'enableMaintenanceMode',
      enabled: this.hasAction('enableMaintenanceMode'),
      icon:    'icon icon-fw icon-unlock',
      label:   this.t('harvester.action.enableMaintenance'),
      total:   1
    };

    const disableMaintenance = {
      action:  'disableMaintenanceMode',
      enabled: this.hasAction('disableMaintenanceMode'),
      icon:    'icon icon-fw icon-lock',
      label:   this.t('harvester.action.disableMaintenance'),
      total:   1
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

  get consoleUrl() {
    const url = this.metadata?.annotations?.[HCI_ANNOTATIONS.HOST_CONSOLE_URL];

    if (!url) {
      return false;
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `http://${ url }`;
    }

    return url;
  }

  get filteredSystemLabels() {
    const reg = /(k3s|kubernetes|kubevirt|harvesterhci|k3os)+\.io/;

    const labels = pickBy(this.labels, (value, key) => {
      return !reg.test(key);
    });

    ALLOW_SYSTEM_LABEL_KEYS.map((key) => {
      const value = this?.metadata?.labels?.[key];

      if (value) {
        labels[key] = value;
      }
    });

    return labels;
  }

  get nameDisplay() {
    return (
      this.metadata?.annotations?.[HCI_ANNOTATIONS.HOST_CUSTOM_NAME] ||
      this.name
    );
  }

  get stateDisplay() {
    if (this.isEnteringMaintenance) {
      return 'Entering maintenance mode';
    }

    if (this.isMaintenance) {
      return 'Maintenance';
    }

    if (this.isCordoned) {
      return 'Cordoned';
    }

    return stateDisplay(this.state);
  }

  get stateBackground() {
    return colorForState(
      this.stateDisplay,
      this.stateObj?.error,
      this.stateObj?.transitioning
    ).replace('text-', 'bg-');
  }

  get stateDescription() {
    const currentIP = this.metadata?.annotations?.[HCI_ANNOTATIONS.CURRENT_IP];
    const initIP = this.metadata?.annotations?.[HCI_ANNOTATIONS.INIT_IP];

    if (initIP && currentIP && currentIP !== initIP) {
      return this.t('harvester.host.inconsistentIP', { currentIP, initIP });
    }

    return super.stateDescription;
  }

  get stateObj() {
    const currentIP = this.metadata?.annotations?.[HCI_ANNOTATIONS.CURRENT_IP];
    const initIP = this.metadata?.annotations?.[HCI_ANNOTATIONS.INIT_IP];

    if (initIP && currentIP && currentIP !== initIP) {
      this.metadata.state.error = true;
    }

    return this.metadata?.state;
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
    detailLocation.name = `${ HARVESTER_PRODUCT }-c-cluster-resource`;

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

    return findLast(addresses, address => address.type === 'InternalIP')
      ?.address;
  }

  get isMaster() {
    return (
      this.metadata?.labels?.[HCI_ANNOTATIONS.NODE_ROLE_MASTER] !== undefined ||
      this.metadata?.labels?.[HCI_ANNOTATIONS.NODE_ROLE_CONTROL_PLANE] !==
        undefined
    );
  }

  cordon() {
    this.doActionGrowl('cordon', {});
  }

  uncordon() {
    this.doAction('uncordon', {});
  }

  enableMaintenanceMode(resources = this) {
    this.$dispatch('promptModal', {
      resources,
      component: 'HarvesterMaintenanceDialog'
    });
  }

  disableMaintenanceMode() {
    this.doAction('disableMaintenanceMode', {});
  }

  get isUnSchedulable() {
    return (
      this.metadata?.labels?.[HCI_ANNOTATIONS.NODE_SCHEDULABLE] === 'false' ||
      this.spec.unschedulable
    );
  }

  get isMigratable() {
    const states = ['in-progress', 'unavailable'];

    return (
      !this.metadata?.annotations?.[HCI_ANNOTATIONS.MAINTENANCE_STATUS] &&
      !this.isUnSchedulable &&
      !states.includes(this.state)
    );
  }

  get isCordoned() {
    return this.isUnSchedulable;
  }

  get isEnteringMaintenance() {
    return (
      this.metadata?.annotations?.[HCI_ANNOTATIONS.MAINTENANCE_STATUS] ===
      'running'
    );
  }

  get isMaintenance() {
    return (
      this.metadata?.annotations?.[HCI_ANNOTATIONS.MAINTENANCE_STATUS] ===
      'completed'
    );
  }

  get longhornDisks() {
    const inStore = this.$rootGetters['currentProduct'].inStore;
    const longhornNode = this.$rootGetters[`${ inStore }/byId`](
      LONGHORN.NODES,
      `longhorn-system/${ this.id }`
    );
    const diskStatus = longhornNode?.status?.diskStatus || {};
    const diskSpec = longhornNode?.spec?.disks || {};

    const longhornDisks = Object.keys(diskStatus).map((key) => {
      const conditions = diskStatus[key]?.conditions || [];
      const readyCondition = findBy(conditions, 'type', 'Ready') || {};
      const schedulableCondition = findBy(conditions, 'type', 'Schedulable') || {};

      return {
        ...diskSpec[key],
        ...diskStatus[key],
        name:             key,
        storageReserved:  diskSpec[key]?.storageReserved,
        storageAvailable: diskStatus[key]?.storageAvailable,
        storageMaximum:   diskStatus[key]?.storageMaximum,
        storageScheduled: diskStatus[key]?.storageScheduled,
        readyCondition,
        schedulableCondition,
      };
    });

    return longhornDisks;
  }

  get pods() {
    const inStore = this.$rootGetters['currentProduct'].inStore;
    const pods = this.$rootGetters[`${ inStore }/all`](POD) || [];

    return pods.filter(
      p => p?.spec?.nodeName === this.id && p?.metadata?.name !== 'removing'
    );
  }

  get reserved() {
    try {
      return JSON.parse(this.metadata.annotations[HCI_ANNOTATIONS.HOST_REQUEST] || '{}');
    } catch {
      return {};
    }
  }

  get cpuReserved() {
    return parseSi(this.reserved.cpu || '0');
  }

  get memoryReserved() {
    return parseSi(this.reserved.memory || '0');
  }

  get canDelete() {
    const nodes = this.$rootGetters['harvester/all'](NODE) || [];

    return nodes.length > 1;
  }
}
