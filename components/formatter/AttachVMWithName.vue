<script>
import { HCI } from '@/config/types';

export default {
  props: {
    value: {
      type:    String,
      default: ''
    }
  },

  data() {
    const vmList = this.$store.getters['virtual/all'](HCI.VM) || [];

    return { vmList };
  },

  computed: {
    vm() {
      const vm = this.vmList.find( V => V.id === `default/${ this.value }`);

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
