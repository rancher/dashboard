<script>
import Bar from '@/components/graph/Bar';
import { formatPercent } from '@/utils/string';

export const PreferredDirection = {
  LESS: 'LESS',
  MORE: 'MORE'
};

/**
 * A percentage bar which can be used to display how much a resource is being consumed.
 */
export default {
  components: { Bar },
  props:      {
    /**
     * A value representing the percentage to be displayed. *Must be a value between 0 and 100*.
     */
    value: {
      type:      Number,
      required:  true,
      validator(value) {
        return value >= 0 && value <= 100;
      }
    },

    /**
     * A value which indicates which direction is better so we can change the color appropriately.
     */
    preferredDirection: {
      type:    String,
      default: PreferredDirection.LESS
    },

    /**
     * Determines whether we display the numerical percentage value to the right of the bar.
     */
    showPercentage: {
      type:    Boolean,
      default: false
    }
  },

  computed: {
    primaryColor() {
      const isLess = this.preferredDirection === PreferredDirection.LESS;
      const threshold = isLess ? 80 : 20;

      const left = isLess ? this.value : threshold;
      const right = isLess ? threshold : this.value;

      if (left <= right) {
        return '--primary';
      }

      return '--error';
    },
    formattedPercentage() {
      return formatPercent(this.value);
    }
  },
};
</script>

<template>
  <span class="percentage-bar">
    <Bar :percentage="value" :primary-color="primaryColor" />
    <span v-if="showPercentage" class="ml-5">{{ formattedPercentage }}</span>
  </span>
</template>

<style lang="scss" scoped>
.percentage-bar {
  display: flex;
  flex-direction: row;
}
</style>
