<script>
export default {
  props: {
    percentage: {
      type:     Number,
      required: true
    },
    primaryColor: {
      type:    String,
      default: '--primary'
    },
    secondaryColor: {
      type:    String,
      default: '--border'
    },
    slices: {
      type:    Array,
      default: () => []
    },
    /**
     * The Small (4px) or Medium (7px) size of the progress bar from the design system
     */
    size: {
      type:      String,
      default:   'medium',
      validator: (value) => ['small', 'medium'].includes(value)
    }
  },
  computed: {
    indicatorStyle() {
      return {
        width:           `${ this.percentage }%`,
        backgroundColor: `var(${ this.primaryColor })`
      };
    },
    barStyle() {
      return { backgroundColor: `var(${ this.secondaryColor })` };
    },
    sliceStyles() {
      return this.slices.map((slice) => ({
        left:       `${ slice }%`,
        visibility: slice < this.percentage ? 'visible' : 'hidden'
      }));
    }
  }
};
</script>

<template>
  <div
    class="bar"
    :class="size"
    :style="barStyle"
  >
    <div
      class="indicator"
      :style="indicatorStyle"
    />
    <div
      v-for="(sliceStyle, i) in sliceStyles"
      :key="i"
      class="slice"
      :style="sliceStyle"
    />
  </div>
</template>

<style lang="scss" scoped>
.bar {
    $medium-height: 7px;
    $small-height: 4px;

    width: 100%;
    height: $medium-height;
    border-radius: math.div($medium-height, 2);
    overflow: hidden;
    position: relative;

    &.small {
      height: $small-height;
      border-radius: math.div($small-height, 2);
    }

    .indicator {
        height: 100%;
    }

    .slice {
      position: absolute;
      top: 0;
      bottom: 0;
      width: 1px;
      background-color: var(--body-bg);
    }
}
</style>
