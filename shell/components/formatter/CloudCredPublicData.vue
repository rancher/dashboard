<script>

export default {
  props: {
    value: {
      type:     String,
      required: true
    },
    row: {
      type:    Object,
      default: () => {
        return {};
      }
    }
  },

  async fetch() {
    await this.row.getSecret();
  },
};
</script>

<template>
  <div v-if="value && !$fetchState.pending">
    <span>{{ value }}</span>
  </div>
  <div v-else>
    <span class="text-muted">&mdash;</span>
  </div>
</template>
