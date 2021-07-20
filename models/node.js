import { HCI } from '@/config/labels-annotations';
import { NAME as VIRTUAL } from '@/config/product/virtual';
import { clone } from '@/utils/object';
import findLast from 'lodash/findLast';

export const listNodeRoles = (isControlPlane, isWorker, isEtcd, allString) => {
  const res = [];

  if (isControlPlane) {
    res.push('Control Plane');
  }
  if (isWorker) {
    res.push('Worker');
  }
  if (isEtcd) {
    res.push('Etcd');
  }
  if (res.length === 3 || res.length === 0) {
    return allString;
  }

  return res.join(', ');
};

export default {
  detailLocation() {
    if (this.$rootGetters['currentProduct'].name !== VIRTUAL) {
      return;
    }

    const detailLocation = clone(this._detailLocation);

    detailLocation.params.resource = 'host';

    return detailLocation;
  },

  doneOverride() {
    if (this.$rootGetters['currentProduct'].name !== VIRTUAL) {
      return;
    }

    const detailLocation = clone(this._detailLocation);

    delete detailLocation.params.namespace;
    delete detailLocation.params.id;
    detailLocation.params.resource = 'host';
    detailLocation.name = 'c-cluster-product-resource';

    return detailLocation;
  },

  parentLocationOverride() {
    if (this.$rootGetters['currentProduct'].name !== VIRTUAL) {
      return;
    }

    return this.doneOverride;
  },

  internalIp() {
    const addresses = this.status?.addresses || [];

    return findLast(addresses, address => address.type === 'InternalIP')?.address;
  },

  isMaster() {
    return this.metadata?.labels?.[HCI.NODE_ROLE_MASTER] !== undefined || this.metadata?.labels?.[HCI.NODE_ROLE_CONTROL_PLANE] !== undefined;
  },

};
