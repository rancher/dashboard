<script>
export default {
  props: {
    loading: {
      type:    Boolean,
      default: true,
    },
    // How to size and position the loading indicator - supports three modes:
    // 'content' - the content area only (not side nav or header)
    // 'main' - entire main view excluding the header, but including the side nav
    // 'relative' - content up to the nearest relatively positioned element
    mode: {
      type:    String,
      default: 'content',
    },
    noDelay: {
      type:    Boolean,
      default: false,
    }
  },

  data() {
    return {
      timer: null, showMessage: this.noDelay, isTerminalOpen: false
    };
  },

  mounted() {
    this.timer = setTimeout(() => {
      this.showMessage = true;
    }, 250);

    this.isTerminalOpen = this.$store.getters['wm/allTabs']?.length;
  },

  beforeUnmount() {
    clearTimeout(this.timer);
  }
};
</script>

<template>
  <div
    v-if="loading"
    class="loading-indicator"
  >
    <div
      v-if="showMessage"
      class="overlay"
      :class="{
        'overlay-content-mode' : mode === 'content',
        'overlay-main-mode' : mode === 'main',
        'behind-terminal': isTerminalOpen
      }"
    >
      <t
        k="generic.loading"
        :raw="true"
      />
    </div>
  </div>
  <div v-else>
    <slot />
  </div>
</template>

<style lang="scss" scoped>
  .overlay {
    align-items: center;
    background-color: var(--overlay-bg);
    display: flex;
    justify-content: center;
    position: absolute;
    bottom: 0;
    top: 0;
    left: 0;
    right: 0;
    text-align: center;

    // Covers both default `content` mode, an often used `relative` mode and any other value of mode
    z-index: z-index('loading');

    &.behind-terminal {
      z-index: -1;
    }

    &-main-mode {
      top: var(--header-height);
      z-index: z-index('loadingMain');
    }

    &-content-mode {
      left: calc(var(--nav-width));
      top: var(--header-height);
    }
  }
</style>
