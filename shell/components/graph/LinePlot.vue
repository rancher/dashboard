<script>
import * as d3 from 'd3';
export default {
  props: {
    graphWidth: {
      type:     Number,
      required: true
    },
    graphHeight: {
      type:     Number,
      required: true
    },
    // [
    //   {
    //     points: [],
    //     domain: [n,m]
    //   }
    // ]
    dataSets: {
      type:    Array,
      default: () => []
    },
    ticks: {
      type:    Number,
      default: 6
    },
    interval: {
      type:    Number,
      default: 0
    }
  },
  data() {
    return { initial: 0 };
  },
  computed: {
    elapsedTime() {
      return (Date.now() - this.initial) / 1000;
    },
    // get size of largest data set to scale x-axis
    largestSetSize() {
      return this.dataSets.map(set => set.points.length).reduce((a, b) => Math.max(a, b));
    },
    lines() {
      const vm = this;
      const paths = [];

      for ( let i = 0 ; i < this.dataSets.length; i++) {
        const dataSet = this.dataSets[i].points;
        const domain = this.dataSets[i].domain;
        const range = [0, 10];

        const path = d3.line()
          .x((d, i) => vm.scaleX(range, i))
          .y(d => vm.scaleY(domain, d));

        paths.push(path(dataSet));
      }

      return paths;
    }
  },
  watch: {
    dataSets: {
      handler(oldSets, newSets) {
        const vm = this;

        newSets.forEach((set, i) => {
          const group = d3.selectAll(`.lines--${ i }`).selectAll('*').nodes();

          if (group) {
            group.forEach(element => vm.animateLine(element));
          }
        });
      },
      deep: true
    },
    graphHeight() {
      if (this.dataSets[0] ) {
        this.makeYAxis(this.dataSets[0]);
      }
    }
  },

  mounted() {
    setInterval(() => {
      this.initial++
      ;
    }, 1000);
  },
  methods: {
    animateLine(ref) {
      if (this.interval !== 0) {
        console.log('animating...'); // eslint-disable-line no-console
        // calculate px distance to move line
        const distance = this.scaleX([0, 10], 0);

        ref.animate([{ transform: ' translateX(0px)' }, { transform: `translateX(-${ distance }px)` }], this.interval);
      }
    },
    makeYAxis(dataSet) {
      const vm = this;
      const domain = dataSet.domain;
      const scale = d3.scaleLinear().domain(domain).range([0, vm.graphHeight]);
      const yAxis = d3.axisLeft(scale)
        .ticks(vm.ticks)
        .tickSize(-vm.graphWidth, 0, 0)
        .tickFormat('');

      d3.select(vm.$refs.svg).select('.grid')
        .call(yAxis);
    },
    scaleX(domain, value) {
      const vm = this;
      const scale = d3.scaleLinear().domain(domain).range([0, vm.graphWidth]);

      return scale(value);
    },
    scaleY(domain, value) {
      const vm = this;
      const scale = d3.scaleLinear().domain(domain).range([vm.graphHeight, 0]);

      return scale(value);
    },
  }

};
</script>

<template>
  <svg
    ref="svg"
    class="lineplot"
    preserveAspectRatio="xMidYMid meet"
    :viewBox="`0 0 ${graphWidth+2} ${graphHeight+2}`"
  >
    <g
      v-for="(set, i) in dataSets"
      :key="i"
      :class="`lines--${i}`"
    >
      <path
        :key="i"
        :d="lines[i]"
        class="line"
      />
      <circle
        v-for="(point, index) in set.points"
        :key="`${index}--circle`"
        class="data-circle"
        r="4"
        :cx="scaleX([0, 10], index)"
        :cy="scaleY(set.domain, point)"
      />
    </g>
    <g
      class="grid"
    />
  </svg>
</template>

<style lang="scss">
@import "~shell/assets/styles/base/_color.scss";
    svg.lineplot{
      overflow: hidden;
    }

    .line {
        fill: none;
        stroke: #64399a;
        stroke-width: 2px;
    }

    .data-circle {
        fill: #1b1c21;
        stroke: #64399a;
    }

    g:nth-of-type(2n) *{
          stroke: #306990;
    }

    .grid .tick line {
        stroke: white;
        opacity: 0.25;
    }

    .grid path {
      stroke-width: 0;
    }
</style>
