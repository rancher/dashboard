import { MANAGEMENT_NODE } from '@shell/config/labels-annotations';
import {
  ADDRESSES, CAPI, MANAGEMENT, NODE, NORMAN
} from '@shell/config/types';
import { NAME as EXPLORER } from '@shell/config/product/explorer';
import { listNodeRoles } from '@shell/models/cluster/node';
import { insertAt } from '@shell/utils/array';
import { downloadUrl } from '@shell/utils/download';
import HybridModel from '@shell/plugins/steve/hybrid-class';

export default class MgmtNode extends HybridModel {
  get _availableActions() {
    const out = super._availableActions;

    const downloadKeys = {
      action:  'downloadKeys',
      enabled: !!this.norman?.links?.nodeConfig,
      icon:    'icon icon-fw icon-download',
      label:   this.t('node.actions.downloadNodeConfig'),
    };

    const scaleDown = {
      action:   'scaleDown',
      enabled:  !!this.canScaleDown,
      icon:     'icon icon-minus icon-fw',
      label:    this.t('node.actions.scaleDown'),
      bulkable: true,
    };

    insertAt(out, 0, { divider: true });
    insertAt(out, 0, downloadKeys);
    insertAt(out, 0, scaleDown);

    return out;
  }

  get kubeNodeName() {
    return this.metadata.labels[MANAGEMENT_NODE.NODE_NAME];
  }

  get mgmtClusterId() {
    return this.id.substring(0, this.id.indexOf('/'));
  }

  get kubeNodeDetailLocation() {
    return this.kubeNodeName ? {
      name:   'c-cluster-product-resource-id',
      params: {
        cluster:  this.mgmtClusterId,
        product:  EXPLORER,
        resource: NODE,
        id:       this.kubeNodeName
      }
    } : null;
  }

  get isWorker() {
    return this.spec.worker;
  }

  get isControlPlane() {
    return this.spec.controlPlane;
  }

  get isEtcd() {
    return this.spec.etcd;
  }

  get roles() {
    const { isControlPlane, isWorker, isEtcd } = this;

    return listNodeRoles(isControlPlane, isWorker, isEtcd, this.t('generic.all'));
  }

  get pool() {
    const nodePoolID = this.spec.nodePoolName.replace(':', '/');

    return this.$rootGetters['management/byId'](MANAGEMENT.NODE_POOL, nodePoolID);
  }

  get norman() {
    const id = this.id.replace('/', ':');

    return this.$rootGetters['rancher/byId'](NORMAN.NODE, id);
  }

  get canDelete() {
    return this.norman?.hasLink('remove');
  }

  get canUpdate() {
    return this.hasLink('update') && this.norman?.hasLink('update');
  }

  remove() {
    return this.norman?.remove();
  }

  downloadKeys() {
    const url = this.norman?.links?.nodeConfig;

    if ( url ) {
      downloadUrl(url);
    }
  }

  async scaleDown(resources) {
    const safeResources = Array.isArray(resources) ? resources : [this];

    await Promise.all(safeResources.map((node) => {
      return node.norman?.doAction('scaledown');
    }));
  }

  get provisioningCluster() {
    return this.$getters['all'](CAPI.RANCHER_CLUSTER).find(c => c.mgmtClusterId === this.mgmtClusterId);
  }

  get doneOverride() {
    return this.provisioningCluster?.detailLocation;
  }

  get canClone() {
    return false;
  }

  get ipaddress() {
    return this.status.internalNodeStatus?.addresses?.find(({ type }) => type === ADDRESSES.INTERNAL_IP)?.address || '-';
  }

  get canScaleDown() {
    const isInOnlyPool = this.pool?.provisioningCluster?.pools?.length === 1;
    const isOnlyNode = this.pool?.nodes?.length === 1;
    const hasAction = this.norman?.actions?.scaledown;

    return hasAction && (!isInOnlyPool || !isOnlyNode);
  }
}
