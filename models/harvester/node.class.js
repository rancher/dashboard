import pickBy from 'lodash/pickBy';
import { HCI } from '@/config/types';
import { HCI as HCI_ANNOTATIONS } from '@/config/labels-annotations';
import { clone } from '@/utils/object';
import findLast from 'lodash/findLast';
import { colorForState, stateDisplay } from '@/plugins/steve/resource-class';
import SteveModel from '@/plugins/steve/steve-class';

export default class HciNode extends SteveModel {
  get _availableActions() {
    const cordon = {
      action:     'cordon',
      enabled:    this.hasAction('cordon'),
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
      ...this._standardActions
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
    return colorForState(this.stateDisplay).replace('text-', 'bg-');
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

  get isCordoned() {
    return !!this.spec.unschedulable;
  }

  get isEnteringMaintenance() {
    return this.metadata?.annotations?.[HCI_ANNOTATIONS.MAINTENANCE_STATUS] === 'running';
  }

  get isMaintenance() {
    return this.metadata?.annotations?.[HCI_ANNOTATIONS.MAINTENANCE_STATUS] === 'completed';
  }
}
