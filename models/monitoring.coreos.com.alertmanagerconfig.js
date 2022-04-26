import SteveModel from '@/plugins/steve/steve-class';
import { MONITORING } from '@/config/types';
import {
  _YAML, _CREATE, _EDIT, _VIEW, _CONFIG
} from '@/config/query-params';
import { set } from '@/utils/object';

export default class AlertmanagerConfig extends SteveModel {
  applyDefaults() {
    if (this.spec) {
      return this.spec;
    }
    const existingReceivers = this.spec?.route?.receivers || [];
    const existingReceiverNames = existingReceivers.map((receiver) => {
      return receiver.name;
    });

    const defaultSpec = {
      receivers: [...existingReceivers],
      route:     {
        receivers:      existingReceiverNames,
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

  getAlertmanagerConfigDetailRoute() {
    return {
      name:   'c-cluster-product-resource-namespace-id',
      params: {
        cluster:   this.$rootGetters['clusterId'],
        product:   'monitoring',
        resource:  MONITORING.ALERTMANAGERCONFIG,
        namespace: this.metadata?.namespace,
        id:        this.name,
      },
      hash: '#receivers'
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
        alertmanagerconfigid: this.id
      },
      query: {
        mode: _VIEW, receiverName, currentView: _CONFIG
      }
    };
  }

  getEditReceiverYamlRoute(receiverName) {
    return {
      name:   'c-cluster-monitoring-alertmanagerconfig-alertmanagerconfigid-receiver',
      params: {
        cluster:              this.$rootGetters['clusterId'],
        alertmanagerconfigid: this.id
      },
      query: {
        mode:         this.mode || _EDIT,
        receiverName,
        currentView:  _YAML
      }
    };
  }

  getEditReceiverConfigRoute(receiverName, queryMode) {
    return {
      name:   'c-cluster-monitoring-alertmanagerconfig-alertmanagerconfigid-receiver',
      params: {
        cluster:              this.$store.getters['clusterId'],
        alertmanagerconfigid: this.id
      },
      query: {
        mode:         queryMode || _EDIT,
        receiverName,
        currentView:  _CONFIG
      }
    };
  }
}
