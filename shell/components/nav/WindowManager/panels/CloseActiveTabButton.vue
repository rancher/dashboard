<script setup lang="ts">
import { RcButton } from '@components/RcButton';
import { RcIcon } from '@components/RcIcon';

/**
 * Closes the window manager's active tab. Hidden until focused, so the panel must pass the
 * accessible name, the placement style and the focus, blur and click listeners, which fall through
 * to the button.
 */
</script>

<template>
  <RcButton
    data-testid="wm-close-active-tab-button"
    variant="ghost"
    size="small"
    class="close-active-tab sr-only"
  >
    <RcIcon
      type="close"
      size="inherit"
    />
  </RcButton>
</template>

<style lang="scss" scoped>
  .close-active-tab {
    --rc-button-padding: 0;

    &.rc-button:focus {
      position: absolute;
      z-index: 2;
      clip: auto;
      margin: 0;
      overflow: visible;
      min-width: 0;
      border: none;
      border-radius: var(--border-radius);
      background: transparent;
      font-size: 10px;

      .rc-icon {
        visibility: hidden;
      }
    }

    &.close-active-tab-detached.rc-button:focus {
      border: 1px solid var(--wm-border);
      border-radius: 0;
      background-color: var(--wm-tabs-bg);
      color: var(--body-text);
      font-size: 14px;

      .rc-icon {
        visibility: visible;
      }
    }

    &.close-active-tab-detached.rc-button:focus-visible {
      outline-offset: -2px;
    }

    @media (forced-colors: active) {
      &.rc-button:focus .rc-icon {
        visibility: visible;
      }
    }
  }
</style>
