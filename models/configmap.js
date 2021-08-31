import { NAME as VIRTUAL } from '@/config/product/virtual';
import { clone } from '@/utils/object';

export default {
  displayNameOverride() {
    if (this.$rootGetters['currentProduct'].inStore === VIRTUAL) {
      return this.$rootGetters['i18n/t'](`typeLabel.cloudtemplate`, { count: 1 });
    }
  },

  keysDisplay() {
    const keys = [
      ...Object.keys(this.data || []),
      ...Object.keys(this.binaryData || [])
    ];

    if ( !keys.length ) {
      return '(none)';
    }

    // if ( keys.length >= 4 ) {
    //   return `${keys[0]}, ${keys[1]}, ${keys[2]} and ${keys.length - 3} more`;
    // }

    return keys.join(', ');
  },

  detailLocation() {
    if (this.$rootGetters['currentProduct'].inStore !== VIRTUAL) {
      return this._detailLocation;
    }

    const detailLocation = clone(this._detailLocation);

    detailLocation.params.resource = 'cloudTemplate';

    return detailLocation;
  },

  doneOverride() {
    if (this.$rootGetters['currentProduct'].inStore !== VIRTUAL) {
      return;
    }

    const detailLocation = clone(this._detailLocation);

    delete detailLocation.params.namespace;
    delete detailLocation.params.id;
    detailLocation.params.resource = 'cloudTemplate';
    detailLocation.name = 'c-cluster-product-resource';

    return detailLocation;
  },

  parentLocationOverride() {
    if (this.$rootGetters['currentProduct'].inStore !== VIRTUAL) {
      return;
    }

    return this.doneOverride;
  },
};
