<script>
import { formatPercent } from '@/utils/string';
/**
 * A percentage bar which can be used to display how much a resource is being consumed.
 */
export default {
  props: {
    /**
     * A value representing the percentage to be displayed. *Must be a value between 0 and 100*.
     */
    value: {
      type:      Number,
      required:  true,
    },

    /**
     * Indicates the number of tick marks that should be displayed.
     */
    ticks: {
      type:    Number,
      default: 10,
    }
  },

  computed: {
    formattedValue() {
      return formatPercent(this.value);
    },
  },
  methods: {
    getTickBackgroundClass(i) {
      const barPercentage = i / this.ticks;
      const valuePercentage = Math.round(this.value / this.ticks) * this.ticks / 100;

      if (valuePercentage < barPercentage) {
        return 'bg-muted';
      }

      if (barPercentage <= 0.6) {
        return 'bg-success';
      }

      if (barPercentage <= 0.8) {
        return 'bg-warning';
      }

      return 'bg-error';
    }
  },
};
</script>

<template>
  <span class="percentage-bar">
    <span class="percentage">{{ formattedValue }}</span>
    <span class="bar">
      <span v-for="i in ticks" :key="i" class="tick" :class="getTickBackgroundClass(i)">&nbsp;</span>
    </span>
  </span>
</template>

<style lang='scss'>
  .percentage-bar {
    .percentage {
      vertical-align: middle;
      width: 32px;
    }
    .bar {
      vertical-align: -5px; // this will align percentage-text in the center without having to change the line height
      margin-left: 3px;
      .tick {
        display: inline-block;
        overflow: hidden;
        margin-right: 3px;
        width: 3px;
        font-size: 1.2em;
      }
    }
  }
</style>
