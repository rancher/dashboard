<script>
import { announce } from '@shell/utils/aria-announce';

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
    },
    /**
     * Announce the wait to screen readers (WCAG 2.2 SC 4.1.3). The overlay is visual only, so
     * without this a screen reader user gets no sign that anything is happening.
     */
    announceStatus: {
      type:    Boolean,
      default: true,
    }
  },

  data() {
    return { timer: null, showMessage: this.noDelay };
  },

  mounted() {
    this.timer = setTimeout(() => {
      this.showMessage = true;

      // Tied to the same delay as the visible overlay, so a load that resolves straight away
      // stays silent instead of announcing a wait that never happened.
      if (this.loading && this.announceStatus) {
        announce(this.$store.getters['i18n/t']('generic.loading'));
      }
    }, 250);
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
      :class="{ 'overlay-content-mode' : mode === 'content', 'overlay-main-mode' : mode === 'main' }"
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
    background-color: var(--subtle-overlay-bg);
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
