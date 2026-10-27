<script setup lang="ts">
/**
 * The standard drawer: a header with the title and a close button, a tinted
 * body, and, when the drawer has actions, a footer with a Close button
 * followed by them.
 *
 * It fills its nearest positioned ancestor, which in the shell is the slide-in
 * panel. Both close buttons emit `close`, and taking the drawer down stays the
 * consumer's call.
 */
import {
  Comment, Fragment, Text, computed, useSlots
} from 'vue';
import type { VNode } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import RcButton from '@components/RcButton/RcButton.vue';
import { RcHeading } from '@components/RcHeading';
import type { RcDrawerProps } from './types';

const props = defineProps<RcDrawerProps>();
const slots = useSlots();

const emit = defineEmits<{
  close: [];
}>();

const close = () => emit('close');

const store = useStore();
const { t } = useI18n(store);

const closeAriaLabel = computed(() => t('component.drawer.chrome.ariaLabel.close', { target: props.title }));

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

const hasActions = () => rendersContent(slots['additional-actions']?.());
</script>

<template>
  <div
    class="rc-drawer"
    role="dialog"
    aria-modal="true"
    :aria-label="title"
  >
    <div class="header">
      <RcHeading
        :size="4"
        class="title"
        role="heading"
        aria-level="2"
        data-testid="rc-drawer-title"
      >
        <!-- @slot The title, for when it needs more than the string the `title` prop takes. It renders inside the drawer's heading, so put no heading in it, and put buttons in `header-actions`. -->
        <slot name="title">
          {{ title }}
        </slot>
      </RcHeading>
      <!-- @slot Icon buttons that act on the drawer's content, such as Dock to shell or Expand all, beside the close button. Size them like it, and give each an `aria-label` and a tooltip. -->
      <slot name="header-actions" />
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
    <div
      class="body"
      data-testid="rc-drawer-body"
    >
      <!-- @slot The drawer body. Text goes straight in; wrap a form or a table in an `RcDrawerCard`. -->
      <slot />
    </div>
    <div
      v-if="hasActions()"
      class="footer"
      data-testid="rc-drawer-footer"
    >
      <!-- @slot The footer's Close button. Replace it when the drawer needs a different one, such as Cancel; it receives `close`, which closes the drawer. -->
      <slot
        name="close"
        :close="close"
      >
        <RcButton
          variant="secondary"
          size="large"
          :aria-label="closeAriaLabel"
          @click="close"
        >
          {{ t('component.drawer.chrome.close') }}
        </RcButton>
      </slot>
      <!-- @slot The drawer's actions, such as its primary action, after the footer's Close button. The footer only shows when there is one. -->
      <slot name="additional-actions" />
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
