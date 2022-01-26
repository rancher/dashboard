<script>
let id = 0;

export default {
  props: {
    percentage: {
      type:    Number,
      default: 0.75
    },
    strokeWidth: {
      type:    Number,
      default: 22
    },
    primaryStrokeColor: {
      type:     String,
      required: true
    },
    primaryStrokeGradientColor: {
      type:    String,
      default: null
    },
    secondaryStrokeColor: {
      type:     String,
      required: true
    },
    secondaryStrokeGradientColor: {
      type:    String,
      default: null
    },
    rotate: {
      type:    Number,
      default: 90
    },
    showText: {
      type:    Boolean,
      default: false
    },
  },
  data() {
    return { id: id++ };
  },
  computed: {
    viewportSize() {
      return 100;
    },
    radius() {
      const outerRadius = this.viewportSize / 2;
      const halfStrokeWidth = this.strokeWidth / 2;

      return outerRadius - halfStrokeWidth;
    },
    center() {
      return this.viewportSize / 2;
    },
    viewBox() {
      return `0 0 ${ this.viewportSize } ${ this.viewportSize }`;
    },
    circumference() {
      return 2 * Math.PI * this.radius;
    },
    transform() {
      return `rotate(${ this.rotate }, ${ this.center }, ${ this.center })`;
    },
    strokeDasharray() {
      // This needs to be the circumference of the circle in order to allow the path to be filled
      return this.circumference;
    },
    strokeDashoffset() {
      // This needs to be the percentage of the circumference that we won't show as it will hide that portion of the path
      return this.circumference * (1 - this.percentage);
    },
    primaryStrokeColorId() {
      return `primary-${ id }`;
    },
    secondaryStrokeColorId() {
      return `secondary-${ id }`;
    },
    parsePercentage() {
      return parseInt(this.percentage * 100) || 0;
    },
  }
};

</script>

<template>
  <svg class="circle" width="100%" height="100%" :viewBox="viewBox">
    <g :transform="transform">
      <defs>
        <linearGradient :id="primaryStrokeColorId" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="50%" :stop-color="primaryStrokeGradientColor || primaryStrokeColor" />
          <stop offset="100%" :stop-color="primaryStrokeColor" />
        </linearGradient>
        <linearGradient :id="secondaryStrokeColorId" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="50%" :stop-color="secondaryStrokeGradientColor || secondaryStrokeColor" />
          <stop offset="100%" :stop-color="secondaryStrokeColor" />
        </linearGradient>
      </defs>
      <circle
        :r="radius"
        :cy="center"
        :cx="center"
        :stroke-width="strokeWidth"
        :stroke="`url(#${secondaryStrokeColorId})`"
        fill="none"
      />
      <circle
        :r="radius"
        :cy="center"
        :cx="center"
        :stroke-width="strokeWidth"
        :stroke="`url(#${primaryStrokeColorId})`"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="circumference * (1 - percentage)"
        fill="none"
      />
    </g>

    <text
      v-if="showText"
      :x="center"
      :y="center"
      style="font-size: 25; dominant-baseline:  middle; text-anchor:middle;"
      :fill="`url(#${primaryStrokeColorId})`"
    >
      {{ parsePercentage }}%
    </text>
  </svg>
</template>

<style lang="scss" scoped>
svg.text {
  fill: red
}
</style>
