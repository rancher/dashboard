<script>
/*
    Wrap d3 SVG charts in styled divs which preserve given aspect ratio
*/
import * as d3 from 'd3';
export default {
  props: {
    aspectRatio: {
      type:    Array,
      default: () => [4, 3]
    }
  },
  data() {
    return { isMounted: false };
  },
  computed: {
    graphWidth() {
      if (!this.isMounted) {
        return 0;
      }

      return d3.select(this.$refs.outer).node().getBoundingClientRect().width;
    },
    graphHeight() {
      if (!this.isMounted) {
        return 0;
      }

      return d3.select(this.$refs.inner).node().getBoundingClientRect().height;
    },
  },
  // track when component is mounted to use d3 DOM reference
  mounted() {
    this.isMounted = true;
  },
};
</script>

<template>
  <div
    ref="outer"
    class="aspect--outer"
  >
    <div
      ref="inner"
      class="aspect--inner"
      :style="{paddingBottom: 100 * aspectRatio[1]/aspectRatio[0] + '%' }"
    >
      <slot
        class="aspect--svg"
        :graphWidth="graphWidth"
        :graphHeight="graphHeight"
      />
    </div>
  </div>
</template>

<style lang = 'scss' scoped>
    .aspect{
      &--outer{
        width: 100%;
        height: 100%;
        position: relative;
      }
        &--inner{
          overflow: hidden;
          height: 0;
          position: relative;
        }
        &--svg {
          position: absolute;
          height: 100%;
          width: 100%;
          left: 0;
          top: 0;
        }
    }

</style>
