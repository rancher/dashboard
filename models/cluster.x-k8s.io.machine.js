import { CAPI, NODE } from '@/config/types';
import { CAPI as CAPI_LABELS, MACHINE_ROLES } from '@/config/labels-annotations';
import { NAME as EXPLORER } from '@/config/product/explorer';
import { listNodeRoles } from '@/models/cluster/node';
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
      label:      this.t('node.actions.downloadSSHKey'),
    };

    insertAt(out, 0, { divider: true });
    insertAt(out, 0, downloadKeys);
    insertAt(out, 0, openSsh);

    return out;
  },

  canClone() {
    return false;
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

  operatingSystem() {
    return this.metadata?.labels['cattle.io/os'] || 'linux';
  },

  kubeNodeDetailLocation() {
    const kubeId = this.status?.nodeRef?.name;
    const cluster = this.cluster?.status?.clusterName;

    if ( kubeId && cluster ) {
      return {
        name:   'c-cluster-product-resource-id',
        params: {
          cluster:  this.cluster.status.clusterName,
          product:  EXPLORER,
          resource: NODE,
          id:       kubeId
        }
      };
    }

    return kubeId;
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

    return listNodeRoles(isControlPlane, isWorker, isEtcd, this.t('generic.all'));
  },
};
