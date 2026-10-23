<script>
/*
    Wrap d3 SVG charts in styled divs which preserve given aspect ratio
*/
import { observeReveal } from '@components/utils/reveal';

export default {
  props: {
    aspectRatio: {
      type:    Array,
      default: () => [4, 3]
    }
  },
  data() {
    return { graphWidth: 0, graphHeight: 0 };
  },
  // measure once mounted to use the DOM references
  mounted() {
    this.measure();

    // Mounted while hidden (e.g. in a collapsed RcSection) the size is 0, so measure again once shown
    this.stopObservingReveal = observeReveal(this.$refs.outer, this.measure);
  },
  beforeUnmount() {
    this.stopObservingReveal?.();
  },
  methods: {
    measure() {
      this.graphWidth = this.$refs.outer.getBoundingClientRect().width;
      this.graphHeight = this.$refs.inner.getBoundingClientRect().height;
    },
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
