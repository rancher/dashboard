import { MANAGEMENT_NODE } from '@/config/labels-annotations';
import { CAPI, MANAGEMENT, NODE } from '@/config/types';
import { NAME as EXPLORER } from '@/config/product/explorer';
import { listNodeRoles } from '@/models/cluster/node';

export default {

  kubeNodeName() {
    return this.metadata.labels[MANAGEMENT_NODE.NODE_NAME];
  },

  mgmtClusterId() {
    return this.id.substring(0, this.id.indexOf('/'));
  },

  kubeNodeDetailLocation() {
    return this.kubeNodeName ? {
      name:   'c-cluster-product-resource-id',
      params: {
        cluster:  this.mgmtClusterId,
        product:  EXPLORER,
        resource: NODE,
        id:       this.kubeNodeName
      }
    } : null;
  },

  isWorker() {
    return this.spec.worker;
  },

  isControlPlane() {
    return this.spec.controlPlane;
  },

  isEtcd() {
    return this.spec.etcd;
  },

  roles() {
    const { isControlPlane, isWorker, isEtcd } = this;

    return listNodeRoles(isControlPlane, isWorker, isEtcd, this.t('generic.all'));
  },

  pool() {
    const nodePoolID = this.spec.nodePoolName.replace(':', '/');

    return this.$rootGetters['management/byId'](MANAGEMENT.NODE_POOL, nodePoolID);
  },

  provisioningCluster() {
    return this.$getters['all'](CAPI.RANCHER_CLUSTER).find(c => c.name === this.namespace);
  },

  doneOverride() {
    return {
      name:   'c-cluster-product-resource-namespace-id',
      params: {
        resource:  CAPI.RANCHER_CLUSTER,
        namespace: this.provisioningCluster?.namespace,
        id:        this.namespace
      }
    };
  }

};
