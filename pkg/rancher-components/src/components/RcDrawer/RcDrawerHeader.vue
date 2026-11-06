<script setup lang="ts">
/**
 * The standard drawer header: the drawer's title, its header actions and a
 * close button. An `RcDrawer` shows one with its `title` unless you put one in
 * its `header` slot, which you do for a richer title or for actions.
 */
import { inject } from 'vue';
import { RcHeading } from '@components/RcHeading';
import { DrawerContext, defaultContext } from './types';

const { title, close, closeAriaLabel } = inject<DrawerContext>('drawerContext') || defaultContext;
</script>

<template>
  <div class="rc-drawer-header">
    <RcHeading
      :size="4"
      class="title"
      role="heading"
      aria-level="2"
      data-testid="rc-drawer-title"
    >
      <!-- @slot The title, for when it needs more than the drawer's `title`, which still names the drawer. It renders inside the drawer's heading, so put no heading or buttons in it. -->
      <slot>
        {{ title }}
      </slot>
    </RcHeading>
    <!-- @slot Icon buttons that act on the drawer's content, such as Dock to shell or Expand all, beside the close button. Size them like it, and give each an `aria-label` and a tooltip. -->
    <slot name="actions" />
    <button
      type="button"
      class="btn role-link close"
      :aria-label="closeAriaLabel"
      data-testid="rc-drawer-close"
      @click="close"
    >
      <i class="icon icon-close" />
    </button>
  </div>
</template>

<style lang="scss" scoped>
.rc-drawer-header {
  display: contents;
}

.title {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  margin: 0;
  overflow-wrap: anywhere;
}

.close {
  display: inline-flex;
  flex-shrink: 0;
  justify-content: center;
  width: 24px;
  height: 24px;
  color: var(--body-text);
}
</style>
