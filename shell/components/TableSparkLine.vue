<script>
import * as d3 from 'd3';

export default {
  props: {
    width: {
      type:    Number,
      default: 100
    },
    height: {
      type:    Number,
      default: 20
    },
    inputDatum: {
      type:    Number,
      default: 0
    },
    min: {
      type:    Number,
      default: 0
    },
    max: {
      type:    Number,
      default: 500
    }
  },

  data() {
    return { dataSet: [this.inputDatum], isMounted: false };
  },

  computed: {
    graphWidth() {
      if (!this.isMounted) {
        return 0;
      }

      const divWidth = d3.select('.graphContainer').node().getBoundingClientRect().width;

      return Math.max(this.width, divWidth);
    },
    graphHeight() {
      if (!this.isMounted) {
        return 0;
      }

      const divHeight = d3.select('.graphContainer').node().getBoundingClientRect().height;

      return Math.max(this.height, divHeight);
    },
    scaleX() {
      return d3.scaleLinear().domain([0, 10]).range([0, this.graphWidth])
      ;
    },
    scaleY() {
      return d3.scaleLinear().domain([this.min, this.max]).range([this.graphHeight, 0]);
    },

    line() {
      const vm = this;

      const path = d3.line()
        .x((d, i) => vm.scaleX(i))
        .y((d) => vm.scaleY(d));

      return path(this.dataSet);
    }
  },
  watch: {
    inputDatum(newProp) {
      this.dataSet.push(newProp);
      if (this.dataSet.length > 10) {
        this.dataSet.shift();
      }
      //   this.drawLine();
    }
  },
  // track when component is mounted to use d3 DOM reference
  mounted() {
    this.isMounted = true;
  },

};
</script>

<template>
  <div class="graphContainer">
    <svg
      :width="graphWidth"
      :height="graphHeight"
    >
      <path :d="line" />
    </svg>
  </div>
</template>

<style scoped>
    .graphContainer {
        overflow: hidden;
        height: 100%;
    }
    path {
        fill: none;
        stroke: #6e3daa;
        stroke-width: 1.5px
    }

</style>
