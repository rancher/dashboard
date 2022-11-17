<script>
import { get } from '@shell/utils/object';

export default {
  props: {
    row: {
      type:     Object,
      required: true,
    },

    value: {
      type:    String,
      default: ''
    },

    longValueKey: {
      type:    String,
      default: '',
    },

    tooltipPlacement: {
      type:    String,
      default: 'auto'
    },
  },

  computed: {
    longValue() {
      return get(this.row, this.longValueKey);
    },

    showTooltip() {
      return !!this.longValue && this.value !== this.longValue;
    },
  },
};
</script>

<template>
  <span
    v-if="!value"
    class="text-muted"
  >
    &mdash;
  </span>
  <span
    v-else-if="showTooltip"
    v-tooltip="{content: longValue, placement: tooltipPlacement}"
  >
    {{ value }}
  </span>
  <span v-else>
    {{ value }}
  </span>
</template>
