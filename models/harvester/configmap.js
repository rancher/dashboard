import { clone } from '@/utils/object';
import { HCI } from '@/config/types';

export default {
  displayNameOverride() {
    return this.$rootGetters['i18n/t'](`typeLabel."${ HCI.CLOUD_TEMPLATE }"`, { count: 1 });
  },

  detailLocation() {
    const detailLocation = clone(this._detailLocation);

    detailLocation.params.resource = HCI.CLOUD_TEMPLATE;

    return detailLocation;
  },

  doneOverride() {
    const detailLocation = clone(this._detailLocation);

    delete detailLocation.params.namespace;
    delete detailLocation.params.id;
    detailLocation.params.resource = HCI.CLOUD_TEMPLATE;
    detailLocation.name = 'c-cluster-product-resource';

    return detailLocation;
  },

  parentLocationOverride() {
    return this.doneOverride;
  },
};
