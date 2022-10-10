<script>
export default {
  props: {
    row: {
      type:     Object,
      required: true,
    },

    prefix: {
      type:    String,
      default: '',
    },

    value: {
      type:    String,
      default: '',
    },
  },

  computed: {
    text() {
      return this.$store.getters['i18n/withFallback'](`${ this.prefix }.${ this.value || this.row.id }`, null, this.value);
    },
  },
};
</script>

<template>
  <span>
    {{ text }}
  </span>
</template>
