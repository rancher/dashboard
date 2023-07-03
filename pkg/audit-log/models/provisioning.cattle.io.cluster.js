import cluster from '@shell/models/provisioning.cattle.io.cluster.js';
import { SETTING } from '@shell/config/settings';
import { MANAGEMENT } from '@shell/config/types';
import { BLANK_CLUSTER } from '@shell/store';
import { AUDIT_LOG_UI_EXTENSION } from '@shell/store/features';

export default class K8sAuditLogcluster extends cluster {
  get _availableActions() {
    const out = super._availableActions;
    const k8sAuditLog = {
      action:   'viewK8sAuditLog',
      label:    this.t('cluster.k8sAuditLog'),
      bulkable: false,
      icon:     'icon icon-file',
    };

    if (!this.$rootGetters['features/get'](AUDIT_LOG_UI_EXTENSION)) {
      const auditLogServerUrl = this.$rootGetters['management/byId'](MANAGEMENT.SETTING, SETTING.AUDIT_LOG_SERVER_URL)?.value;

      k8sAuditLog.enabled = !!auditLogServerUrl;
    } else {
      delete k8sAuditLog.enabled;
    }

    out.splice(0, 0, k8sAuditLog);

    return out;
  }

  viewK8sAuditLog() {
    const type1 = this.machineProvider && this.machineProviderDisplay;
    const type2 = this.isCustom ? 'custom' : '';
    const type3 = this.mgmt?.providerForEmberParam === 'import' ? 'imported' : '';

    if (!this.$rootGetters['features/get'](AUDIT_LOG_UI_EXTENSION)) {
      const r = {
        name:   `c-cluster-manager-pages-page`,
        params: { page: 'k8s-cluster-audit-log' },
        query:  {
          cluster: this.metadata.name, clusterName: this.nameDisplay, clusterType: type1 || type2 || type3
        }
      };

      this.currentRouter().push(r);
    } else {
      const r = {
        name:   `c-cluster-manager-k8sAuditLog`,
        params: { cluster: BLANK_CLUSTER },
        query:  {
          clusterId: this.mgmt?.id, cluster: this.metadata.name, clusterName: this.nameDisplay, clusterType: type1 || type2 || type3
        }
      };

      this.currentRouter().push(r);
    }
  }
}
