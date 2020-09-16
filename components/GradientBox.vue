<script>
export default {
  props: {
    // a "r, g, b" tuple
    primaryColorVar: {
      type:     String,
      default: null,
    },

    // Show the left side
    showTab: {
      type:     Boolean,
      default: true,
    }
  },

  computed: {
    leftColor() {
      return this.customizePrimaryColorOpacity(0.25);
    },

    rightColor() {
      return this.customizePrimaryColorOpacity(0.125);
    },

    primaryColor() {
      return this.customizePrimaryColorOpacity(1);
    },

    style() {
      const background = `background: transparent linear-gradient(94deg, ${ this.leftColor } 0%, ${ this.rightColor } 100%) 0% 0% no-repeat padding-box;`;
      const border = this.showTab ? `border-left: 9px solid ${ this.primaryColor };` : '';

      return `${ background }${ border }`;
    }
  },

  methods: {
    customizePrimaryColorOpacity(opacity) {
      return `rgba(var(${ this.primaryColorVar }), ${ opacity })`;
    }
  }
};
</script>

<template>
  <div class="gradient-box" :class="{showTab}" :style="style">
    <slot />
  </div>
</template>

<style lang="scss">
  .gradient-box {
      border-radius: 5px;
  }
</style>
