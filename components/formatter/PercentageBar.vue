<script>
export default {
  props: {
    value: {
      type:     String,
      default: ''
    },
    row: {
      type:     Object,
      required: true
    },
    col: {
      type:     Object,
      default: () => {}
    },
  },
  data() {
    return { NUMBER_OF_TICKS: 10 };
  },
  methods: {
    getTickBackgroundClass(i) {
      const valuePercentage = Number.parseFloat(this.value) / 100;
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
  }
};
</script>

<template>
  <span>
    <span class="percentage">{{ value }}%</span>
    <span class="bar">
      <span v-for="i in NUMBER_OF_TICKS" :key="i" class="tick" :class="getTickBackgroundClass(i)">&nbsp;</span>
    </span>
  </span>
</template>

<style lang='scss'>
  .percentage {
      vertical-align: middle;
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
