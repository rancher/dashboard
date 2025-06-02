<script>
export default {
  props: {
    row: {
      type:     Object,
      required: true,
    },
  },
  computed: {
    descriptionText() {
      return this.row?.description || '';
    },
  },
};
</script>
<template>
  <span
    v-clean-tooltip="{content: descriptionText, skidding: -30, placement: 'top-start', popperClass: ['description-tooltip']}"
    class="description-text"
  >
    {{ descriptionText }}
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
