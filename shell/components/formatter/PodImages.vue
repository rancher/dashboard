<script>
import { mapGetters } from 'vuex';

// For the main image hat we show, use these to ignore istio proxy images so that
// we are more likely to show the important main iamge and not the istio sidecar
const IGNORE_IMAGES = ['istio/proxy', 'gcr.io/istio-release/proxy', 'mirrored-istio-proxy'];

export default {
  props: {
    value: {
      type:     [Array, String],
      default: () => {
        return [];
      }
    },

    row: {
      type:    Object,
      default: () => {
        return {};
      }
    }
  },
  computed: {
    ...mapGetters({ t: 'i18n/t' }),
    images() {
      if ( this.row?.imageNames ) {
        return this.row.imageNames;
      } else {
        return this.value;
      }
    },
    imageLabels() {
      if (Array.isArray(this.images) && this.images.length > 1) {
        let imagesNames = '';

        this.images.forEach((name, i) => {
          imagesNames += `&#8226; ${ name }<br>`;
        });

        return imagesNames;
      }

      return null;
    },
    mainImage() {
      const images = this.images;
      const filter = images.filter(image => !IGNORE_IMAGES.find(i => image.includes(i)));

      return filter.length > 0 ? filter[0] : images[0];
    }
  }

};
</script>

<template>
  <span>
    <span>{{ mainImage }}</span><br>
    <span
      v-if="images.length-1>0"
      v-tooltip.bottom="imageLabels"
      class="plus-more"
    >{{ t('generic.plusMore', {n:images.length-1}) }}</span>
  </span>
</template>
