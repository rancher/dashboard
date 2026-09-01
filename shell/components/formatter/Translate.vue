<script>
import { get } from '@shell/utils/object';

export default {
  props: {
    row: {
      type:     Object,
      required: true,
    },

    fallbackPath: {
      type:    String,
      default: '',
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
    l10nId() {
      return `${ this.prefix ? `${ this.prefix }.` : '' }${ this.value || this.row.id }`;
    },

    l10nFallback() {
      const fallback = this.value;

      if (this.fallbackPath) {
        return get(this.row, this.fallbackPath) || fallback;
      }

      return fallback;
    },

    text() {
      return this.$store.getters['i18n/withFallback'](this.l10nId, null, this.l10nFallback);
    },
  },
};
</script>

<template>
  <span>
    {{ text }}
  </span>
</template>
