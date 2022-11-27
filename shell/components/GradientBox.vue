<script>
export default {
  props: {
    // a "r, g, b" tuple
    primaryColorVar: {
      type:    String,
      default: null,
    },

    // Show the left side
    showTab: {
      type:    Boolean,
      default: true,
    },
    showSolid: {
      type:    Boolean,
      default: false,
    },
    backgroundOpacityAdjustment: {
      type:    Number,
      default: 1
    },
    plain: {
      type:    Boolean,
      default: false,
    }
  },

  computed: {
    leftColor() {
      return this.showSolid ? this.primaryColor : this.customizePrimaryColorOpacity(0.25 * this.backgroundOpacityAdjustment);
    },

    rightColor() {
      return this.showSolid ? this.primaryColor : this.customizePrimaryColorOpacity(0.125 * this.backgroundOpacityAdjustment);
    },

    primaryColor() {
      return this.customizePrimaryColorOpacity(1);
    },

    style() {
      if (!this.plain) {
        const background = `background: transparent linear-gradient(94deg, ${ this.leftColor } 0%, ${ this.rightColor } 100%) 0% 0% no-repeat padding-box;`;
        const border = this.showBorder ? `border: 1px solid ${ this.primaryColor };` : '';
        const borderLeft = this.showTab ? `border-left: 9px solid ${ this.primaryColor };` : '';

        return `${ background }${ border }${ borderLeft }`;
      }

      return '';
    },
  },

  methods: {
    customizePrimaryColorOpacity(opacity) {
      return `rgba(var(${ this.primaryColorVar }), ${ opacity })`;
    }
  }
};
</script>

<template>
  <div
    class="gradient-box"
    :class="{'show-tab': showTab, 'plain': plain}"
    :style="style"
  >
    <slot />
  </div>
</template>

<style lang="scss">
  .gradient-box {
      border-radius: 5px;
  }
 </style>

<style lang="scss" scoped>
  .gradient-box.plain {
      border: 1px solid var(--border);
  }
</style>
