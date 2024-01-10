<template>
  <div
    class="label"
    :style="style"
  >
    <svg
      v-if="!global"
      width="10px"
      height="10px"
      viewBox="0 0 10 10"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      xmlns:xlink="http://www.w3.org/1999/xlink"
    >
      <!-- Generator: Sketch 63.1 (92452) - https://sketch.com -->
      <g
        stroke="none"
        stroke-width="1"
      >
        <g id="tag">
          <rect
            fill="#000000"
            fill-rule="nonzero"
            opacity="0"
            x="0"
            y="0"
            width="10"
            height="10"
          />
          <path
            d="M9.06061767,0 L6.24278315,0 C5.72621662,0 5.00464848,0.298752333 4.63933312,0.664067689 L0.273986517,5.02941429 C-0.0913288389,5.39472965 -0.0913288389,5.99254681 0.273986517,6.35786217 L3.64213784,9.72601348 C4.00745319,10.0913288 4.60527036,10.0913288 4.97058571,9.72601348 L9.33561981,5.36097939 C9.70124767,4.99566402 10,4.27409589 10,3.75721685 L10,0.939382334 C10,0.422815801 9.5771842,0 9.06061767,0 Z M7.81248291,3.12502442 C7.29466637,3.12502442 6.87497559,2.70533364 6.87497559,2.18751709 C6.87497559,1.66970055 7.29466637,1.25000977 7.81248291,1.25000977 C8.33029946,1.25000977 8.74999024,1.66970055 8.74999024,2.18751709 C8.74999024,2.70533364 8.33029946,3.12502442 7.81248291,3.12502442 Z"
            fill="currentColor"
          />
        </g>
      </g>
    </svg>
    <i
      v-else
      class="icon icon-user"
    />
    <slot />
  </div>
</template>
<script>

export default {
  props: {
    color: {
      type:    String,
      default: '#FFFFFF'
    },
    global: {
      type:    Boolean,
      default: false
    },
    labelColors: {
      type:     Array,
      required: true
    }
  },
  data() {
    return { };
  },
  computed: {
    style() {
      const color = this.labelColors.find((c) => c.color === this.color)?.textColor;

      return {
        backgroundColor: this.color,
        color
      };
    }
  },
};
</script>

<style scoped>
  .label {
    overflow: hidden;
    display: inline-flex;
    align-items: center;
    gap: 0 4px;
    font-size:12px;
    padding:2px 10px;
    border-radius: 20px;
    border: 1px solid rgb(161, 161, 161);;
  }
</style>
