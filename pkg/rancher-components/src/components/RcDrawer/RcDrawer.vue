<script setup lang="ts">
/**
 * The standard drawer: a header, a tinted body, and a footer when the drawer
 * has actions. Put an `RcDrawerHeader` in its `header` slot, which titles and
 * names the drawer, and an `RcDrawerFooter` in its `footer` slot.
 *
 * It fills its nearest positioned ancestor, which in the shell is the slide-in
 * panel. Every close button emits `close`, and taking the drawer down stays
 * the consumer's call.
 */
import {
  Comment, Fragment, Text, computed, provide, ref, useSlots
} from 'vue';
import type { VNode } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import type { DrawerContext } from './types';

const slots = useSlots();

const emit = defineEmits<{
  close: [];
}>();

const close = () => emit('close');

const store = useStore();
const { t } = useI18n(store);

const title = ref<string>();
const closeAriaLabel = computed(() => t('component.drawer.chrome.ariaLabel.close', { target: title.value }));

provide<DrawerContext>('drawerContext', {
  title, close, closeAriaLabel
});

const rendersContent = (nodes: VNode[] = []): boolean => nodes.some((node) => {
  if (node.type === Comment) {
    return false;
  }

  if (node.type === Fragment) {
    return rendersContent(node.children as VNode[]);
  }

  if (node.type === Text) {
    return !!String(node.children).trim();
  }

  return true;
});

const hasFooter = () => rendersContent(slots.footer?.({ close }));
</script>

<template>
  <div
    class="rc-drawer"
    role="dialog"
    aria-modal="true"
    :aria-label="title"
  >
    <div
      class="header"
      data-testid="rc-drawer-header"
    >
      <!-- @slot The header. Put an `RcDrawerHeader` in it, which gives the drawer its title, its name and the close button. It receives `close`, which closes the drawer. -->
      <slot
        name="header"
        :close="close"
      />
    </div>
    <div
      class="body"
      data-testid="rc-drawer-body"
    >
      <!-- @slot The drawer body. Text goes straight in; wrap a form or a table in an `RcDrawerCard`. -->
      <slot />
    </div>
    <div
      v-if="hasFooter()"
      class="footer"
      data-testid="rc-drawer-footer"
    >
      <!-- @slot The footer, which only shows when this renders something. Put an `RcDrawerFooter` in it for the standard secondary and primary buttons, or lay out your own; it receives `close`, which closes the drawer. -->
      <slot
        name="footer"
        :close="close"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.rc-drawer {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;

  .header {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: var(--header-height);
    padding: 6px 16px;
    background-color: var(--body-bg);
    border-bottom: 1px solid var(--border);
  }

  .body {
    flex: 1;
    overflow-y: scroll;
    padding: 16px;
    background-color: var(--drawer-body-bg);
  }

  .footer {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    align-items: center;
    gap: 16px;
    min-height: 72px;
    padding: 16px;
    background-color: var(--body-bg);
    border-top: 1px solid var(--border);
  }
}
</style>
