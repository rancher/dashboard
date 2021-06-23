import { CAPI } from '@/config/types';
import { CAPI as CAPI_LABELS, MACHINE_ROLES } from '@/config/labels-annotations';
import { escapeHtml } from '@/utils/string';
import { insertAt } from '@/utils/array';
import { downloadUrl } from '@/utils/download';

export default {
  _availableActions() {
    const out = this._standardActions;

    const openSsh = {
      action:     'openSsh',
      enabled:    !!this.links.shell,
      icon:       'icon icon-fw icon-chevron-right',
      label:      'SSH Shell',
    };
    const downloadKeys = {
      action:     'downloadKeys',
      enabled:    !!this.links.sshkeys,
      icon:       'icon icon-fw icon-download',
      label:      'Download SSH Key',
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

  labels() {
    return this.metadata?.labels || {};
  },

  isWorker() {
    return `${ this.labels[MACHINE_ROLES.WORKER] }` === 'true';
  },

  isControlPlane() {
    return `${ this.labels[MACHINE_ROLES.CONTROL_PLANE] }` === 'true';
  },

  isEtcd() {
    return `${ this.labels[MACHINE_ROLES.ETCD] }` === 'true';
  },

  roles() {
    const { isControlPlane, isWorker, isEtcd } = this;

    if (( isControlPlane && isWorker && isEtcd ) ||
        ( !isControlPlane && !isWorker && !isEtcd )) {
      // !isControlPlane && !isWorker && !isEtcd === RKE?
      return 'All';
    }
    // worker+cp, worker+etcd, cp+etcd

    if (isControlPlane && isWorker) {
      return 'Control Plane, Worker';
    }

    if (isControlPlane && isEtcd) {
      return 'Control Plane, Etcd';
    }

    if (isEtcd && isWorker) {
      return 'Etcd, Worker';
    }

    if (isControlPlane) {
      return 'Control Plane';
    }

    if (isEtcd) {
      return 'Etcd';
    }

    if (isWorker) {
      return 'Worker';
    }
  },
};
