import { clone } from '@/utils/object';

export default {
  displayNameOverride() {
    return this.$rootGetters['i18n/t'](`typeLabel.cloudtemplate`, { count: 1 });
  },

  detailLocation() {
    const detailLocation = clone(this._detailLocation);

    detailLocation.params.resource = 'cloudTemplate';

    return detailLocation;
  },

  doneOverride() {
    const detailLocation = clone(this._detailLocation);

    delete detailLocation.params.namespace;
    delete detailLocation.params.id;
    detailLocation.params.resource = 'cloudTemplate';
    detailLocation.name = 'c-cluster-product-resource';

    return detailLocation;
  },

  parentLocationOverride() {
    return this.doneOverride;
  },
};
