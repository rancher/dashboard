<script>

export default {
  props: {
    value: {
      type:    Boolean,
      default: true
    },
  }
};
</script>

<template>
  <span v-if="value">
    <i class="icon icon-lg icon-checkmark" />
  </span>
  <span
    v-else
    class="text-muted"
  >
    &mdash;
  </span>
</template>
