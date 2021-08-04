import { HCI } from '@/config/labels-annotations';
import { NAME as VIRTUAL } from '@/config/product/virtual';
import { clone } from '@/utils/object';
import findLast from 'lodash/findLast';
import { colorForState, stateDisplay } from '@/plugins/steve/resource-instance';
import { PRIVATE } from '@/plugins/steve/resource-proxy';

export default {
  displayNameOverride() {
    if (this.$rootGetters['currentProduct'].inStore === VIRTUAL) {
      return this.$rootGetters['i18n/t'](`typeLabel.host`, { count: 1 });
    }
  },

  _availableActions() {
    // Harvester node actions
    const cordonHarvester = {
      action:     'cordon',
      enabled:    this.hasAction('cordon'),
      icon:       'icon icon-fw icon-pause',
      label:      this.t('harvester.action.cordon'),
      total:      1,
    };

    const uncordonHarvester = {
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

    if (this.$rootGetters['currentProduct'].inStore === VIRTUAL) {
      return [
        cordonHarvester,
        uncordonHarvester,
        enableMaintenance,
        disableMaintenance,
        ...this._standardActions
      ];
    }
  },

  nameDisplay() {
    if (this.$rootGetters['currentProduct'].inStore !== VIRTUAL) {
      return this.name;
    }

    return this.metadata?.annotations?.[HCI.HOST_CUSTOM_NAME] || this.name;
  },

  stateDisplay() {
    if (this.isEnteringMaintenance) {
      return 'Entering maintenance mode';
    }

    if (this.isMaintenance) {
      return 'Maintenance mode';
    }

    if ( !this[PRIVATE].isDetailPage && this.isCordoned ) {
      return 'Cordoned';
    }

    return stateDisplay(this.state);
  },

  stateBackground() {
    return colorForState(this.stateDisplay).replace('text-', 'bg-');
  },

  detailLocation() {
    if (this.$rootGetters['currentProduct'].name !== VIRTUAL) {
      return this._detailLocation;
    }

    const detailLocation = clone(this._detailLocation);

    detailLocation.params.resource = 'host';

    return detailLocation;
  },

  doneOverride() {
    if (this.$rootGetters['currentProduct'].name !== VIRTUAL) {
      return;
    }

    const detailLocation = clone(this._detailLocation);

    delete detailLocation.params.namespace;
    delete detailLocation.params.id;
    detailLocation.params.resource = 'host';
    detailLocation.name = 'c-cluster-product-resource';

    return detailLocation;
  },

  parentLocationOverride() {
    if (this.$rootGetters['currentProduct'].name !== VIRTUAL) {
      return;
    }

    return this.doneOverride;
  },

  internalIp() {
    const addresses = this.status?.addresses || [];

    return findLast(addresses, address => address.type === 'InternalIP')?.address;
  },

  isMaster() {
    return this.metadata?.labels?.[HCI.NODE_ROLE_MASTER] !== undefined || this.metadata?.labels?.[HCI.NODE_ROLE_CONTROL_PLANE] !== undefined;
  },

  cordon() {
    return (resources = this) => {
      this.$commit('node/toggleCordonModal', resources, { root: true });
    };
  },

  uncordon() {
    this.doAction('uncordon', {});
  },

  enableMaintenanceMode() {
    return (resources = this) => {
      this.$commit('node/toggleMaintenanceModal', resources, { root: true });
    };
  },

  disableMaintenanceMode() {
    this.doAction('disableMaintenanceMode', {});
  },

  isCordoned() {
    return !!this.spec.unschedulable;
  },

  isEnteringMaintenance() {
    return this.metadata?.annotations?.[HCI.MAINTENANCE_STATUS] === 'running';
  },

  isMaintenance() {
    return this.metadata?.annotations?.[HCI.MAINTENANCE_STATUS] === 'completed';
  },

};
