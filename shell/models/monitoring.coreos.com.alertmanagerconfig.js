import SteveModel from '@shell/plugins/steve/steve-class';
import { MONITORING } from '@shell/config/types';
import { _YAML, _CREATE, _VIEW, _CONFIG } from '@shell/config/query-params';
import { set } from '@shell/utils/object';

export default class AlertmanagerConfig extends SteveModel {
  applyDefaults() {
    const spec = this.spec || {};

    spec.receivers = spec.receivers || [];

    // Always provide a route object so the Route tab has something to bind to,
    // even when loading a resource that was saved without `spec.route`.
    const route = { ...(spec.route || {}) };

    route.groupBy = route.groupBy || [];
    route.groupWait = route.groupWait || '30s';
    route.groupInterval = route.groupInterval || '5m';
    route.repeatInterval = route.repeatInterval || '4h';
    route.matchers = route.matchers || [];

    spec.route = route;

    set(this, 'spec', spec);
  }

  cleanForSave(data, forNew) {
    const val = super.cleanForSave(data, forNew);
    const route = val?.spec?.route;

    if (route) {
      // When a route is present its `receiver` is required and must match an
      // entry in `spec.receivers`. Until the user has defined a receiver the
      // root route can't direct alerts anywhere, so drop it entirely
      if (!route.receiver) {
        delete val.spec.route;
      }
    }

    return val;
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
