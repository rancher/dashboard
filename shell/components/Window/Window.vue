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

  beforeUnmount() {
    if ( this.beforeClose ) {
      this.beforeClose.apply(this);
    }
  }
};
</script>

<template>
  <div
    class="window"
    :class="{'show-grid': $slots.title && $slots.body}"
  >
    <div
      v-if="$slots.title"
      class="title clearfix"
    >
      <slot name="title" />
    </div>
    <div class="body clearfix">
      <slot name="body" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
  $title-height: 50px;

  .window {
    height: 100%;

    &.show-grid {
      display: grid;
      grid-template-areas:
        "body"
        "title";
      grid-template-rows: auto $title-height;
    }
  }

  .title {
    grid-area: title;
    background-color: var(--wm-title-bg);
    border-top: 1px solid var(--wm-title-border);
    height: 100%;
    vertical-align: middle;
    // line-height: $title-height - 4px;
    padding: 10px;
    overflow-x: auto;
    overflow-y: hidden;
  }

  .body {
    grid-area: body;
    height: 100%;
    overflow: hidden;
  }
</style>
