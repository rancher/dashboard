<script>
import GraphCircle from './Circle';

export default {
  components: { GraphCircle },
  props:      {
    percentage: {
      type:    Number,
      default: 0.75
    },
    strokeWidth: {
      type:    Number,
      default: 8
    }
  },
  computed: {
    calculatedPercentage() {
      return 0.5 * this.percentage;
    }
  }
};

</script>

<template>
  <div class="half-circle">
    <GraphCircle
      v-bind="$attrs"
      :rotate="-180"
      :percentage="calculatedPercentage"
      :stroke-width="strokeWidth"
    />
  </div>
</template>

<style lang="scss">
.half-circle {
    overflow: hidden;
    width: 100%;
    height: 100%;

    .circle {
        height: 200%;
    }
}
</style>
