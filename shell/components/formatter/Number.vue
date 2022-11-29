<script>
export default {
  props: {
    value: {
      type:    [String, Number],
      default: ''
    },

    prefix: {
      type:    String,
      default: ''
    },

    suffix: {
      type:    String,
      default: ''
    },
  },

  computed: {},
};
</script>

<template>
  <span
    v-if="!value"
    class="text-muted"
  >
    &mdash;
  </span>
  <span v-else>
    {{ t('generic.number', {value, prefix, suffix}) }}
  </span>
</template>
