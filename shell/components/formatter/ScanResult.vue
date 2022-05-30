<script>
import { get } from '@shell/utils/object';
export default {
  props:      {
    value: {
      type:    [String, Number],
      default: null,
    },
    row: {
      type:     Object,
      required: true
    },
  },

  computed: {
    hasResults() {
      return !!get(this.row, 'status.summary');
    }
  }
};
</script>

<template>
  <div v-if="hasResults">
    <span v-if="value || value === 0">
      {{ value }}
    </span>
    <span v-else class="text-muted">&mdash;</span>
  </div>
</template>
