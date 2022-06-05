<script>
import * as d3 from 'd3';
export default {
  props: {
    progress: {
      type:    Number,
      default: 0
    },
    graphWidth:      {
      type:     Number,
      required: true
    },
  },
  data() {
    return { tweenedProgress: this.progress };
  },
  computed: {
    progressColor() {
      const end = [127, 189, 132];
      const init = [189, 127, 127];

      return init.map((val, i) => {
        return (val + ((end[i] - val) * this.progress / 100)).toFixed(0);
      });
    },
    outerRadius() {
      return this.graphWidth / 2;
    },
    innerRadius() {
      return this.outerRadius - this.graphWidth * 0.05;
    },
    endAngle() {
      return this.tweenedProgress * 2 * Math.PI / 100;
    },
    fullArc() {
      const vm = this;
      const arc = d3.arc();

      return arc({
        innerRadius:  vm.innerRadius,
        outerRadius:  vm.outerRadius,
        endAngle:     2 * (Math.PI),
        startAngle:   0
      });
    },
    arc() {
      // progress / 100 == endAngle/ 2pi
      const vm = this;
      const arc = d3.arc();

      return arc({
        innerRadius: vm.innerRadius,
        outerRadius: vm.outerRadius,
        endAngle:    vm.endAngle,
        startAngle:  0
      });
    }
  },
  watch: {
    progress(newProgress, oldProgress) {
      this.tweenedProgress = newProgress;
    }
  }

};

</script>

<template>
  <div>
    <svg
      preserveAspectRatio="xMidYMid meet"
      :viewBox="`0 1 ${graphWidth} ${graphWidth}`"
    >
      <g :transform="`translate(${graphWidth/2}, ${graphWidth/2}) rotate(180)`">
        <path class="background" :d="fullArc"></path>
        <path :style="{fill: `rgb(${progressColor[0]}, ${progressColor[1]}, ${progressColor[2]})`}" :d="arc"></path>
      </g>
    </svg>
  </div>
</template>

<style scoped>
  .background{
    fill:white;
    opacity: 0.15;
  }
</style>
