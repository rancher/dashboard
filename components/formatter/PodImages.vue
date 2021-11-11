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
    }
  }

};
</script>

<template>
  <span>
    <span>{{ images[0] }}</span><br>
    <span v-if="images.length-1>0" class="plus-more">{{ t('generic.plusMore', {n:images.length-1}) }}</span>
  </span>
</template>
