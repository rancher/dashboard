import { clone } from '@shell/utils/object';
import { HCI } from '@shell/config/types';
import NetworkAttachmentDef from '@shell/models/k8s.cni.cncf.io.networkattachmentdefinition';

export default class HarvesterNetworkAttachmentDef extends NetworkAttachmentDef {
  get detailLocation() {
    const detailLocation = clone(this._detailLocation);

    detailLocation.params.resource = HCI.NETWORK_ATTACHMENT;

    return detailLocation;
  }

  get doneOverride() {
    const detailLocation = clone(this._detailLocation);

    delete detailLocation.params.namespace;
    delete detailLocation.params.id;
    detailLocation.params.resource = HCI.NETWORK_ATTACHMENT;
    detailLocation.name = 'c-cluster-product-resource';

    return detailLocation;
  }

  get parentNameOverride() {
    return this.$rootGetters['i18n/t'](`typeLabel."${ HCI.NETWORK_ATTACHMENT }"`, { count: 1 })?.trim();
  }

  get parentLocationOverride() {
    return this.doneOverride;
  }
}
