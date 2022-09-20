import { clone } from '@shell/utils/object';
import { HCI } from '../../types';
import StorageClass from '@shell/models/storage.k8s.io.storageclass';
import { PRODUCT_NAME as HARVESTER_PRODUCT } from '../../config/harvester';

export default class HciStorageClass extends StorageClass {
  get detailLocation() {
    const detailLocation = clone(this._detailLocation);

    detailLocation.params.resource = HCI.STORAGE;
    detailLocation.name = `${ HARVESTER_PRODUCT }-c-cluster-resource-id`;

    return detailLocation;
  }

  get doneOverride() {
    const detailLocation = clone(this._detailLocation);

    delete detailLocation.params.namespace;
    delete detailLocation.params.id;
    detailLocation.params.resource = HCI.STORAGE;
    detailLocation.name = `${ HARVESTER_PRODUCT }-c-cluster-resource`;

    return detailLocation;
  }

  get parentLocationOverride() {
    return this.doneOverride;
  }

  get parentNameOverride() {
    return this.$rootGetters['i18n/t'](`typeLabel."${ HCI.STORAGE }"`, { count: 1 })?.trim();
  }
}
