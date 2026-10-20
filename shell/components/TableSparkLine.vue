<script>
import * as d3 from 'd3';
import { observeReveal } from '@components/utils/reveal';

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
    return { dataSet: [this.inputDatum], containerSize: null };
  },

  computed: {
    graphWidth() {
      if (!this.containerSize) {
        return 0;
      }

      return Math.max(this.width, this.containerSize.width);
    },
    graphHeight() {
      if (!this.containerSize) {
        return 0;
      }

      return Math.max(this.height, this.containerSize.height);
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
  // measure once mounted to use d3 DOM reference
  mounted() {
    this.measure();

    // Mounted while hidden (e.g. in a collapsed RcSection) the size is 0, so measure again once shown
    this.stopObservingReveal = observeReveal(this.$el, this.measure);
  },
  beforeUnmount() {
    this.stopObservingReveal?.();
  },
  methods: {
    measure() {
      const { width, height } = this.$el.getBoundingClientRect();

      this.containerSize = { width, height };
    },
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
