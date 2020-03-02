<script>
import { NODE } from '@/config/types';

export default {
  props: {
    value: {
      type:     String,
      required: true
    },
    row: {
      type:     Object,
      required: true
    },
    col: {
      type:     Object,
      required: true
    },
  },
  data() {
    return { url: '' };
  },
  mounted() {
    this.findNode(this.value);
  },
  methods: {
    findNode(id) {
    //   const node = await this.$store.dispatch('cluster/find', { type: NODE, id });
      const name = 'c-cluster-resource-id';
      const params = { resource: NODE, id: this.value };

      this.url = this.$router.resolve({ name, params }).href;
    }
  }
};
</script>

<template>
  <span>
    <nuxt-link :to="url">
      {{ value }}
    </nuxt-link>
  </span>
</template>
