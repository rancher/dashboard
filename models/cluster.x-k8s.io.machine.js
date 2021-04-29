import { CAPI } from '@/config/types';
import { CAPI as CAPI_LABELS } from '@/config/labels-annotations';
import { escapeHtml } from '@/utils/string';
import { insertAt } from '@/utils/array';
import { downloadUrl } from '@/utils/download';

export default {
  availableActions() {
    const out = this._standardActions;

    const openSsh = {
      action:     'openSsh',
      enabled:    true,
      icon:       'icon icon-fw icon-chevron-right',
      label:      'SSH Shell',
      total:      1,
    };
    const downloadKeys = {
      action:     'downloadKeys',
      enabled:    true,
      icon:       'icon icon-fw icon-download',
      label:      'Download SSH Key',
      total:      1,
    };

    insertAt(out, 0, { divider: true });
    insertAt(out, 0, downloadKeys);
    insertAt(out, 0, openSsh);

    return out;
  },

  openSsh() {
    return () => {
      this.$dispatch('wm/open', {
        id:        `${ this.id }-ssh`,
        label:     this.nameDisplay,
        icon:      'terminal',
        component: 'MachineSsh',
        attrs:     { machine: this, pod: {} }
      }, { root: true });
    };
  },

  downloadKeys() {
    return () => {
      downloadUrl(this.links.sshkeys);
    };
  },

  cluster() {
    if ( !this.spec.clusterName ) {
      return null;
    }

    const clusterId = `${ this.metadata.namespace }/${ this.spec.clusterName }`;

    const cluster = this.$rootGetters['management/byId'](CAPI.RANCHER_CLUSTER, clusterId);

    return cluster;
  },

  poolName() {
    return this.metadata?.labels?.[ CAPI_LABELS.DEPLOYMENT_NAME ] || '';
  },

  poolId() {
    const poolId = `${ this.metadata.namespace }/${ this.poolName }`;

    return poolId;
  },

  pool() {
    return this.$rootGetters['management/byId'](CAPI.MACHINE_DEPLOYMENT, this.poolId);
  },

  groupByLabel() {
    const name = this.cluster?.nameDisplay || this.spec.clusterName;

    return this.$rootGetters['i18n/t']('resourceTable.groupLabel.cluster', { name: escapeHtml(name) });
  },
};
