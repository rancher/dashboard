<script>
import { formatPercent } from '@shell/utils/string';

export default {
  props: {
    value: {
      type:    String,
      default: ''
    },
    row: {
      type:     Object,
      required: true
    },
    col: {
      type:    Object,
      default: () => {}
    },
  },
  computed: {
    podUsage() {
      const podCapacity = this.row.podCapacity;
      const podConsumed = this.row.podConsumed;

      return {
        total: podCapacity,
        used:  podConsumed,
      };
    },

    podPercentage() {
      const podCapacity = this.row.podCapacity;
      const podConsumed = this.row.podConsumed;

      if (!podConsumed || !podCapacity) {
        return '0';
      }

      return formatPercent((podConsumed * 100) / podCapacity);
    }
  }
};
</script>

<template>
  <div>
    <span v-if="podPercentage === '0'">
      N/A
    </span>
    <span v-else>
      {{ podUsage.used }} / {{ podUsage.total }} &nbsp; ({{ podPercentage }})
    </span>
  </div>
</template>
