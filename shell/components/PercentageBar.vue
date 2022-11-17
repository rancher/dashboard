<script>
import Bar from '@shell/components/graph/Bar';
import { formatPercent } from '@shell/utils/string';

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
      type:     Number,
      required: true,
      validator(value) {
        return value >= 0;
      }
    },

    /**
     * A value which indicates which direction is better so we can change the color appropriately (Valid values: 'LESS' or 'MORE')
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
    },

    /**
     * Optional map of percentage:color class stops to apply to bar
     */

    colorStops: {
      type:    Object,
      default: null
    },

    /**
     * Show vertical lines to denote where multiple sources that are contributing to this percentage end
     */
    slices: {
      type:    Array,
      default: () => []
    }
  },

  computed: {
    primaryColor() {
      const isLess = this.preferredDirection === PreferredDirection.LESS;

      if (this.colorStops) {
        const thresholds = Object.keys(this.colorStops).sort();

        if (isLess) {
          let i = thresholds.length - 1;

          while (this.value < thresholds[i]) {
            i--;
          }

          return this.colorStops[thresholds[i]];
        } else {
          let i = 0;

          while (this.value > thresholds[i]) {
            i++;
          }

          return this.colorStops[thresholds[i]];
        }
      }
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
    <Bar
      :percentage="value"
      :primary-color="primaryColor"
      :slices="slices"
    />
    <span
      v-if="showPercentage"
      class="ml-5 percentage-value"
    >{{ formattedPercentage }}</span>
  </span>
</template>

<style lang="scss" scoped>
.percentage-bar {
  display: flex;
  flex-direction: row;

  .percentage-value {
    word-break: keep-all;
  }
}
</style>
