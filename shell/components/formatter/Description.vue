<script>
export default {
  props: {
    value: {
      type:     String,
      required: true,
    }
  },
};
</script>
<template>
  <span
    v-clean-tooltip="{content: value, placement: 'auto', popperClass: ['description-tooltip']}"
    class="description-text"
  >
    {{ value }}
  </span>
</template>
<style lang="scss">
  .description-text {
    display: block;
    width: inherit;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .description-tooltip {
    overflow-wrap: break-word;
  }
</style>
