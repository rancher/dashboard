<script>
export default {
  props: {
    value: {
      type:    [String, Number],
      default: ''
    },

    qualityFn: {
      type:    Function,
      default: () => 'error'
    },
  },
};
</script>

<template>
  <span :class="`text-${qualityFn(value)}`">
    {{ value }}
  </span>
</template>
