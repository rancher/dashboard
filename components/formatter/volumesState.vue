<script>
import { HCI } from '@/config/types';

export default {
  props: {
    value: {
      type:    [String, Object],
      default: () => {}
    },
    row: {
      type:     Object,
      required: true
    },
    col: {
      type:     Object,
      default: () => {}
    },
  },

  data() {
    const dataVolumeList = this.$store.getters['cluster/all'](HCI.DATA_VOLUME) || [];
    const vmList = this.$store.getters['cluster/all'](HCI.VM) || [];

    return {
      vmList,
      dataVolumeList,
    };
  },

  computed: {
    formatValue() {
      if (this.col.type === 'attached') {
        return this.vm?.metadata?.name || 'N/A';
      }

      return '';
    },
    dataVolume() {
      const id = `${ this.value?.namespace }/${ this.value?.name }`;

      return this.dataVolumeList.find( (D) => {
        return D.id === id;
      });
    },

    vm() {
      return this.row.attachVM;
    },

    to() {
      return this.vm?.detailLocation;
    },
  }
};
</script>

<template>
  <div>
    <span v-if="col.type !== 'attached'">
      {{ formatValue }}
    </span>

    <span else>
      <n-link v-if="to" :to="to">
        {{ formatValue }}
      </n-link>
    </span>
  </div>
</template>
