import { clone, set } from '@shell/utils/object';
import { _YAML, _CREATE, _VIEW, _CONFIG } from '@shell/config/query-params';
import { HCI } from '../../types';
import SteveModel from '@shell/plugins/steve/steve-class';
import { PRODUCT_NAME as HARVESTER_PRODUCT } from '../../config/harvester';

export default class HciAlertmanagerConfig extends SteveModel {
  get _detailLocation() {
    return {
      name:   this.alertmanagerConfigDoneRouteName,
      params: {
        cluster:   this.$rootGetters['clusterId'],
        resource:  HCI.ALERTMANAGERCONFIG,
        namespace: this.metadata?.namespace,
        id:        this.name,
      },
      hash:  '#receivers',
      query: { as: 'config' }
    };
  }

  get doneOverride() {
    const detailLocation = clone(this._detailLocation);

    delete detailLocation.params.namespace;
    delete detailLocation.params.id;
    detailLocation.params.resource = HCI.ALERTMANAGERCONFIG;
    detailLocation.name = `${ HARVESTER_PRODUCT }-c-cluster-resource`;

    return detailLocation;
  }

  get parentNameOverride() {
    return this.$rootGetters['i18n/t'](`typeLabel."${ HCI.ALERTMANAGERCONFIG }"`, { count: 1 })?.trim();
  }

  get parentLocationOverride() {
    return this.doneOverride;
  }

  applyDefaults() {
    if (this.spec) {
      return this.spec;
    }
    const existingReceivers = this.spec?.route?.receivers || [];

    const defaultSpec = {
      receivers: [...existingReceivers],
      route:     {
        receivers:      this.spec?.route?.receivers || [],
        groupBy:        this.spec?.route?.groupBy || [],
        groupWait:      this.spec?.route?.groupWait || '30s',
        groupInterval:  this.spec?.route?.groupInterval || '5m',
        repeatInterval: this.spec?.route?.repeatInterval || '4h',
        match:          this.spec?.route?.match || {},
        matchRe:        this.spec?.route?.matchRe || {}
      }
    };

    set(this, 'spec', defaultSpec);
  }

  get _availableActions() {
    const out = super._availableActions;

    return out;
  }

  getReceiverActions(alertmanagerConfigActions) {
    return alertmanagerConfigActions.filter((actionData) => {
      if (actionData.divider) {
        return true;
      }
      switch (actionData.action) {
      case 'goToEdit':
        return true;
      case 'goToEditYaml':
        return true;
      case 'promptRemove':
        return true;
      default:
        return false;
      }
    });
  }

  get alertmanagerConfigDoneRouteName() {
    return `${ HARVESTER_PRODUCT }-c-cluster-resource-namespace-id`;
  }

  getCreateReceiverRoute() {
    return {
      name:   `${ HARVESTER_PRODUCT }-c-cluster-alertmanagerconfig-alertmanagerconfigid-receiver`,
      params: { cluster: this.$rootGetters['clusterId'], alertmanagerconfigid: this.id },
      query:  { mode: _CREATE, currentView: _CONFIG }
    };
  }

  getReceiverDetailLink(receiverName) {
    return {
      name:   `${ HARVESTER_PRODUCT }-c-cluster-alertmanagerconfig-alertmanagerconfigid-receiver`,
      params: {
        cluster:              this.$rootGetters['clusterId'],
        alertmanagerconfigid: this.id,
        receiverName
      },
      query: {
        mode: _VIEW, receiverName, currentView: _CONFIG
      }
    };
  }

  getEditReceiverYamlRoute(receiverName, queryMode) {
    return {
      name:   `${ HARVESTER_PRODUCT }-c-cluster-alertmanagerconfig-alertmanagerconfigid-receiver`,
      params: {
        cluster:              this.$rootGetters['clusterId'],
        alertmanagerconfigid: this.id
      },
      query: {
        mode:        queryMode || _VIEW,
        receiverName,
        currentView: _YAML
      }
    };
  }

  getEditReceiverConfigRoute(receiverName, queryMode) {
    return {
      name:   `${ HARVESTER_PRODUCT }-c-cluster-alertmanagerconfig-alertmanagerconfigid-receiver`,
      params: {
        cluster:              this.$rootGetters['clusterId'],
        alertmanagerconfigid: this.id
      },
      query: {
        mode:        queryMode || _VIEW,
        receiverName,
        currentView: _CONFIG
      }
    };
  }
}
