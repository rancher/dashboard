import project from '@shell/models/management.cattle.io.project';
import { PROJECT_ID } from '@shell/config/query-params';
import { MANAGEMENT } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';
import { insertAt } from '@shell/utils/array';
import { AUDIT_LOG_UI_EXTENSION } from '@shell/store/features';

export default class AuditLogProject extends project {
  get _availableActions() {
    const extension = this.$rootGetters['features/get'](AUDIT_LOG_UI_EXTENSION);
    const out = super._availableActions;
    const auditLog = {
      action: 'auditLog',
      icon:   'icon icon-fw icon-globe',
      label:  this.t(extension ? 'auditLog.title' : 'nav.auditLog'),
    };

    if (!extension) {
      const auditLogServerUrl = this.$rootGetters['management/byId'](MANAGEMENT.SETTING, SETTING.AUDIT_LOG_SERVER_URL)?.value;

      auditLog.enabled = !!auditLogServerUrl;
    } else {
      delete auditLog.enabled;
    }

    insertAt(out, 0, { divider: true });
    insertAt(out, 0, auditLog);

    return out;
  }

  get auditLog() {
    return (() => {
      if (!this.$rootGetters['features/get'](AUDIT_LOG_UI_EXTENSION)) {
        this.currentRouter().push({
          name:   'c-cluster-legacy-auditLog-page',
          params: {
            cluster: this.$rootGetters['currentCluster'].id,
            page:    'project-audit-log',
            product: 'explorer'
          },
          query: { [PROJECT_ID]: this.id.replace('/', ':') }
        });
      } else {
        this.currentRouter().push({
          name:   'c-project-auditLog',
          params: { cluster: this.$rootGetters['currentCluster'].id, product: 'explorer' },
          query:  { [PROJECT_ID]: this.id.replace('/', ':'), projectName: this.metadata.name }
        });
      }
    })();
  }
}
