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
    }
  },
  data() {
    return { NUMBER_OF_TICKS: 10 };
  },
  computed: {
    formattedValue() {
      return formatPercent(this.value);
    },
  },
  methods: {
    getTickBackgroundClass(i) {
      const valuePercentage = ( this.value / 100 );
      const barPercentage = i / this.NUMBER_OF_TICKS;

      if (valuePercentage < barPercentage) {
        return 'bg-darker';
      }

      if (barPercentage <= 0.6) {
        return 'bg-success';
      }

      if (barPercentage <= 0.8) {
        return 'bg-info';
      }

      return 'bg-error';
    }
  },
};
</script>

<template>
  <span>
    <span class="percentage">{{ formattedValue }}</span>
    <span class="bar">
      <span v-for="i in NUMBER_OF_TICKS" :key="i" class="tick" :class="getTickBackgroundClass(i)">&nbsp;</span>
    </span>
  </span>
</template>

<style lang='scss'>
  .percentage {
    vertical-align: middle;
    width: 32px;
  }
  .bar {
    vertical-align: middle;
    margin-left: 3px;
    .tick {
      display: inline-block;
      overflow: hidden;
      margin-right: 3px;
      width: 3px;
      font-size: 1.2em;
    }
  }
</style>
