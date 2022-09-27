<script>
import { PVC } from '@shell/config/types';
export default {
  props: {
    value: {
      type:    String,
      default: ''
    },
    row: {
      type:    Object,
      default: () => {
        return {};
      }
    }
  },
  async fetch() {
    this.volumeList = await this.$store.dispatch('harvester/findAll', { type: PVC });
  },
  data() {
    return { volumeList: [] };
  },
  computed: {
    volume() {
      const namespace = this.row?.metadata?.namespace;
      const volume = this.volumeList.find( V => V.id === `${ namespace }/${ this.value }`) || {};

      return volume;
    },
    to() {
      return this.volume?.detailLocation;
    },
  }
};
</script>
<template>
  <n-link v-if="to" :to="to">
    {{ value }}
  </n-link>
  <span v-else>
    {{ value }}
  </span>
</template>
