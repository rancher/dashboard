<script>
import { HCI } from '../types';

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

  data() {
    const vmList = this.$store.getters['harvester/all'](HCI.VM) || [];

    return { vmList };
  },

  computed: {
    vm() {
      const vm = this.vmList.find( V => V.id === `${ this.row.metadata.namespace }/${ this.value }`);

      return vm;
    },

    to() {
      return this.vm?.detailLocation;
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
