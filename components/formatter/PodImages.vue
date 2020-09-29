<script>
import { mapGetters } from 'vuex';
import { WORKLOAD_TYPES } from '@/config/types';

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

  data() {
    let images = [];

    if (Object.values(WORKLOAD_TYPES).includes(this.row.type)) {
      images = this.row.imageNames;
    } else {
      images = this.value;
    }

    return { images };
  },

  computed: { ...mapGetters({ t: 'i18n/t' }) }

};
</script>

<template>
  <span>
    <span>{{ images[0] }}</span><br>
    <span v-if="images.length-1>0" class="plus-more">{{ t('generic.plusMore', {n:images.length-1}) }}</span>
  </span>
</template>
