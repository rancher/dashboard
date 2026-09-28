<script setup lang="ts">
import { useStore } from 'vuex';
import { computed, inject, ref } from 'vue';
import { DropdownContext, defaultContext } from '@components/RcDropdown/types';
import RcButton from '@components/RcButton/RcButton.vue';
import { RcButtonType } from '@components/RcButton/types';

const { dropdownItems } = inject<DropdownContext>('dropdownContext') || defaultContext;
const store = useStore();
const unreadCount = computed<number>(() => store.getters['notifications/unreadCount']);
const markAllReadButton = ref<RcButtonType | null>(null);

const markAllRead = (keyboard: boolean) => {
  store.dispatch('notifications/markAllRead');

  // If activated via keyboard, move focus to the next dropdown item
  if (keyboard) {
    moveFocus(true);
  }
};

/**
 * Handles keydown events to navigate between dropdown items.
 * @param {KeyboardEvent} e - The keydown event.
 */
const handleKeydown = (e: KeyboardEvent) => {
  const shouldAdvance = e.key === 'ArrowDown';

  moveFocus(shouldAdvance);
};

// User pressed up/down - move focus to the correct notification item
// Header should always be the first item
const moveFocus = (shouldAdvance: Boolean) => {
  if (dropdownItems.value.length > 1) {
    const newIndex = shouldAdvance ? 1 : dropdownItems.value.length - 1;

    if (dropdownItems.value[newIndex] instanceof HTMLElement) {
      dropdownItems.value[newIndex].focus();
    }
  }
};

const gotFocus = (e: Event) => {
  // If no unread items, then there is no button to focus, so move to the next item
  if (unreadCount.value === 0) {
    moveFocus(true);
  }

  // When the header gets focus, pass the focus onto the 'mark all read' button
  markAllReadButton?.value?.focus();
};
</script>

<template>
  <div
    dropdown-menu-item
    tabindex="-1"
    role="menuitem"
    class="notification-header"
    @click.stop
    @keydown.up.down.stop.prevent="handleKeydown"
    @focus="gotFocus"
  >
    <div class="notification-header">
      <div class="notification-title">
        {{ t('notificationCenter.title') }}
      </div>
      <div v-if="unreadCount !== 0">
        <RcButton
          ref="markAllReadButton"
          variant="ghost"
          size="small"
          tabindex="-1"
          class="mark-all-read"
          data-testid="notifications-center-markall-read"
          @keydown.up.down.stop.prevent="handleKeydown"
          @keydown.enter.space.stop="markAllRead(true)"
          @click="markAllRead(false)"
        >
          {{ t('notificationCenter.markAllRead') }}
        </RcButton>
      </div>
    </div>
    <div class="notification-border" />
  </div>
</template>

<style lang="scss" scoped>
  [dropdown-menu-item] {
    display: flex;
    flex-direction: column;

    .notification-border {
      border-bottom: 1px solid var(--border);
      margin-left: -16px;
      width: calc(100% + 32px);
    }

    .notification-header {
      display: flex;
      flex: 1;
      padding: 6px 16px 16px 16px; // already 10px at the top of the dropdown

      .notification-title {
        font-weight: bold;
        flex: 1;
      }

      .mark-all-read {
        padding: 0;
        min-height: auto;
        font-size: inherit;
        line-height: inherit;
        color: var(--link);

        &:hover {
          color: var(--body-text);
          text-decoration: underline;
        }
      }
    }
  }
</style>
