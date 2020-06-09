<script>
export default {
  props:      {
    row: {
      type:     Object,
      required: true
    },
  },

  async fetch() {
    this.pods = await this.row.findPods(this.$store);
  },

  data() {
    return { pods: [] };
  },

};
</script>

<template>
  <div v-if="pods.length">
    {{ pods.length }}
  </div>
</template>
