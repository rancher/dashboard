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

  async fetch() {
    if (Object.values(WORKLOAD_TYPES).includes(this.row.type)) {
      const pods = await this.row.pods();

      this.images = pods.reduce((images, pod) => {
        const podImages = pod.spec.containers.reduce((all, container) => {
          all.push(container.image);

          return all;
        }, []);

        images.push(...podImages);

        return images;
      }, []);
    }
  },

  data() {
    return { images: this.value };
  },

  computed: { ...mapGetters({ t: 'i18n/t' }) }

};
</script>

<template>
  <span>
    <span>{{ images[0] }}</span><br>
    <span v-if="images.length-1>0" class="plus-more">{{ t('generic.plusMore', {n:images.length-2}) }}</span>
  </span>
</template>
