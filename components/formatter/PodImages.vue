<script>
import { mapGetters } from 'vuex';

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
    }
  }

};
</script>

<template>
  <span>
    <span>{{ images[0] }}</span><br>
    <span
      v-if="images.length-1>0"
      v-tooltip.bottom="imageLabels"
      class="plus-more"
    >{{ t('generic.plusMore', {n:images.length-1}) }}</span>
  </span>
</template>
