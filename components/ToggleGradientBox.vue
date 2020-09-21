<script>
import GradientBox from '@/components/GradientBox';

export default {

  components: { GradientBox },
  props:      {
    value: {
      type:    Boolean,
      default: false
    },
    primaryColorVar: {
      type:    String,
      default: '--primary-color'
    }
  },

  data() {
    return { mouseOver: false };
  },

  computed: {
    backgroundOpacityAdjustment() {
      return this.mouseOver ? 2 : 1;
    },
  },

  methods: {
    onClick() {
      this.$emit('input', !this.value);
    },

    onMouseEnter() {
      this.mouseOver = true;
    },

    onMouseLeave() {
      this.mouseOver = false;
    }
  }
};
</script>

<template>
  <GradientBox
    class="toggle-gradient-box"
    :show-solid="value"
    :primary-color-var="primaryColorVar"
    :background-opacity-adjustment="backgroundOpacityAdjustment"
    @click.native="onClick"
    @mouseenter.native="onMouseEnter"
    @mouseleave.native="onMouseLeave"
  >
    <slot />
  </GradientBox>
</template>

<style lang="scss">
.toggle-gradient-box {
    cursor: pointer;
}
</style>
