import { clone } from '@shell/utils/object';
import { HCI } from '../../types';
import NetworkAttachmentDef from '@shell/models/k8s.cni.cncf.io.networkattachmentdefinition';
import { PRODUCT_NAME as HARVESTER_PRODUCT } from '../../config/harvester';

export default class HarvesterNetworkAttachmentDef extends NetworkAttachmentDef {
  get listLocation() {
    return this.$rootGetters['type-map/optionsFor'](this.type).customRoute || {
      name:   `${ HARVESTER_PRODUCT }-c-cluster-resource`,
      params: {
        product:  HARVESTER_PRODUCT,
        cluster:  this.$rootGetters['clusterId'],
        resource: this.type,
      },
    };
  }

  get doneRoute() {
    return this.listLocation.name;
  }

  get detailLocation() {
    const detailLocation = clone(this._detailLocation);

    detailLocation.params.resource = HCI.NETWORK_ATTACHMENT;
    detailLocation.name = `${ HARVESTER_PRODUCT }-c-cluster-resource`;

    return detailLocation;
  }

  get doneOverride() {
    const detailLocation = clone(this._detailLocation);

    delete detailLocation.params.namespace;
    delete detailLocation.params.id;
    detailLocation.params.resource = HCI.NETWORK_ATTACHMENT;
    detailLocation.name = `${ HARVESTER_PRODUCT }-c-cluster-resource`;

    return detailLocation;
  }

  get parentNameOverride() {
    return this.$rootGetters['i18n/t'](`typeLabel."${ HCI.NETWORK_ATTACHMENT }"`, { count: 1 })?.trim();
  }

  get parentLocationOverride() {
    return this.doneOverride;
  }
}
