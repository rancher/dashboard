<script>
import { FLEET } from '@/config/types';

export default {
  name:  'DetailBundle',
  props: {
    value: {
      type:     Object,
      required: true,
    },
  },

  data() {
    return {
      allFleet:   [],
      allBundles: [],
    };
  },

  async fetch() {
    this.allBundles = await this.$store.dispatch('management/findAll', { type: FLEET.BUNDLE });
    this.allFleet = await this.$store.dispatch('management/findAll', { type: FLEET.CLUSTER });
  },

  computed: {
    selectedBundle() {
      return this.value;
    },
  }

};

</script>

<template>
  <div>{{ JSON.stringify(selectedBundle) }}</div>
</template>
