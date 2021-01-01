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
    }
  }
};
</script>

<template>
  <div class="bar" :style="barStyle">
    <div class="indicator" :style="indicatorStyle" />
  </div>
</template>

<style lang="scss" scoped>
.bar {
    $height: 15px;

    width: 100%;
    height: $height;
    border-radius: $height / 2;
    overflow: hidden;

    .indicator {
        height: 100%;
    }
}
</style>
