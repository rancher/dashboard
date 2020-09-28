<script>
export default {
  name: 'Window',

  props: {
    active: {
      type:     Boolean,
      required: true,
    },

    afterOpen: {
      type:    Function,
      default: null,
    },

    activated: {
      type:    Function,
      default: null,
    },

    deactivated: {
      type:    Function,
      default: null,
    },

    beforeClose: {
      type:    Function,
      default: null,
    }
  },

  watch: {
    active(val) {
      if ( val && this.activated) {
        this.activated.apply(this);
      } else if ( !val && this.deactivated ) {
        this.deactivated.apply(this);
      }
    }
  },

  mounted() {
    if ( this.afterOpen ) {
      this.afterOpen.apply(this);
    }
  },

  beforeDestroy() {
    if ( this.beforeClose ) {
      this.beforeClose.apply(this);
    }
  }
};
</script>

<template>
  <div class="window">
    <div class="title clearfix">
      <slot name="title" />
    </div>
    <div class="body clearfix">
      <slot name="body" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
  $title-height: 35px;

  .window {
    display: grid;
    grid-template-areas:
      "body"
      "title";
    // grid-template-rows: auto $title-height;
    height: 100%;
  }

  .title {
    grid-area: title;
    background-color: var(--wm-title-bg);
    border-top: 1px solid var(--wm-title-border);
    height: 100%;
    vertical-align: middle;
    // line-height: $title-height - 4px;
    padding: 0 5px;
  }

  .body {
    grid-area: body;
    height: 100%;
    overflow: hidden;
  }
</style>
