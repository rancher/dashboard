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
    $height: 15px;

    width: 100%;
    height: $height;
    border-radius: math.div($height, 2);
    overflow: hidden;
    position: relative;

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
