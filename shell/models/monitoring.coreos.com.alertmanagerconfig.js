import SteveModel from '@shell/plugins/steve/steve-class';
import { MONITORING } from '@shell/config/types';
import { _YAML, _CREATE, _VIEW, _CONFIG } from '@shell/config/query-params';
import { set } from '@shell/utils/object';

export default class AlertmanagerConfig extends SteveModel {
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
    return 'c-cluster-product-resource-namespace-id';
  }

  get _detailLocation() {
    return {
      name:   this.alertmanagerConfigDoneRouteName,
      params: {
        cluster:   this.$rootGetters['clusterId'],
        product:   'monitoring',
        resource:  MONITORING.ALERTMANAGERCONFIG,
        namespace: this.metadata?.namespace,
        id:        this.name,
      },
      hash:  '#receivers',
      query: { as: 'config' }
    };
  }

  getCreateReceiverRoute() {
    return {
      name:   'c-cluster-monitoring-alertmanagerconfig-alertmanagerconfigid-receiver',
      params: {
        cluster:              this.$rootGetters['clusterId'],
        alertmanagerconfigid: this.id
      },
      query: { mode: _CREATE, currentView: _CONFIG }
    };
  }

  getReceiverDetailLink(receiverName) {
    return {
      name:   'c-cluster-monitoring-alertmanagerconfig-alertmanagerconfigid-receiver',
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
      name:   'c-cluster-monitoring-alertmanagerconfig-alertmanagerconfigid-receiver',
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
      name:   'c-cluster-monitoring-alertmanagerconfig-alertmanagerconfigid-receiver',
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
