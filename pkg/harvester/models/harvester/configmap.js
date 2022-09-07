import { clone } from '@shell/utils/object';
import { HCI } from '@shell/config/types';
import HarvesterResource from '../harvester';
import { PRODUCT_NAME as HARVESTER_PRODUCT } from '../../config/harvester';

// FIXME: Harvester Request for team to validate navigation (list, create, etc) for this resource type
export default class HciConfigMap extends HarvesterResource {
  get detailLocation() {
    const detailLocation = clone(this._detailLocation);

    detailLocation.params.resource = HCI.CLOUD_TEMPLATE;

    return detailLocation;
  }

  get doneOverride() {
    const detailLocation = clone(this._detailLocation);

    delete detailLocation.params.namespace;
    delete detailLocation.params.id;
    detailLocation.params.resource = HCI.CLOUD_TEMPLATE;
    detailLocation.name = `${ HARVESTER_PRODUCT }-cluster-product-resource`;

    return detailLocation;
  }

  get parentNameOverride() {
    return this.$rootGetters['i18n/t'](`typeLabel."${ HCI.CLOUD_TEMPLATE }"`, { count: 1 })?.trim();
  }

  get parentLocationOverride() {
    return this.doneOverride;
  }
}
