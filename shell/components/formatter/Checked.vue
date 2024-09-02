<script>

export default {
  props: {
    // When sortabletable calculates these values it converts null and undefined to ''
    // passing '' to a prop typed as Boolean coerces it to true
    value: {
      type:    [String, Boolean],
      default: true
    },
  },

  computed: {
    checked() {
      return this.value === true || this.value === 'true';
    }
  },
};
</script>

<template>
  <span v-if="checked">
    <i class="icon icon-checkmark" />
  </span>
  <span
    v-else
    class="text-muted"
  >
    &mdash;
  </span>
</template>
