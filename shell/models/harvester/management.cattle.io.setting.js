import Resource from '@shell//plugins/core-store/resource-class';
import { HCI } from '@shell/config/types';
import { clone } from '@shell/utils/object';

export default class HciSetting extends Resource {
  get detailLocation() {
    const detailLocation = clone(this._detailLocation);

    detailLocation.params.resource = HCI.SETTING;

    return detailLocation;
  }

  get doneOverride() {
    const detailLocation = clone(this._detailLocation);

    delete detailLocation.params.namespace;
    delete detailLocation.params.id;
    detailLocation.params.resource = HCI.SETTING;
    detailLocation.name = 'c-cluster-product-resource';

    return detailLocation;
  }

  get parentNameOverride() {
    return this.$rootGetters['i18n/t'](`typeLabel."${ HCI.SETTING }"`, { count: 1 })?.trim();
  }

  get parentLocationOverride() {
    return this.doneOverride;
  }

  get doneParams() {
    return {
      product:   this.$rootGetters['productId'],
      cluster:   this.$rootGetters['clusterId'],
      resource:  HCI.SETTING,
    };
  }
}
