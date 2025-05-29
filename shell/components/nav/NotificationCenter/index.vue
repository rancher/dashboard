<script setup lang="ts">
import { computed, ref } from 'vue';
import { useStore } from 'vuex';
import Notification from './Notification.vue';
import NotificationHeader from './NotificationHeader.vue';
import {
  RcDropdown,
  RcDropdownSeparator,
  RcDropdownTrigger
} from '@components/RcDropdown';

const store = useStore();
const allNotifications = computed(() => store.getters['notifications/all']);
const unreadLevelClass = computed(() => {
  return store.getters['notifications/unreadCount'] === 0 ? '' : 'unread';
});

// There may be more notifications than we can show on screen, so the popover needs to scroll
const scroller = ref<HTMLElement>();

// This is a workaround
// When either the top or bottom notification are focused via keyboard up/down, the item does not
// fully scroll into view, which looks odd
// Here we adjust the scroll position to fix that - note we do this via a timeout - if we try and
// do this immediately or either via nextTick, this does not work
const scrollPanel = (index: number, count: number) => {
  const DELAY = 175;

  // Header is 0, so 1 is the first notification
  if (index === 1) {
    setTimeout(() => {
      scroller?.value?.scrollTo(0, 0);
    }, DELAY);
  } else if (index === count - 1) {
    setTimeout(() => {
      scroller?.value?.scrollTo(0, 2000000);
    }, DELAY);
  }
};

// Close all of the open growls when the notification center is shown, so that they do not overlap
const open = (opened: boolean) => {
  if (opened) {
    store.dispatch('growl/clear');
  }
};
</script>

<template>
  <rc-dropdown
    :aria-label="t('nav.notifications')"
    @update:open="open"
  >
    <rc-dropdown-trigger
      tertiary
      data-testid="notifications-center"
      :aria-label="t('nav.actionMenu.button.label')"
    >
      <div class="level-indicator">
        <i class="icon icon-lg icon-notify-bell" />
        <div
          class="trigger-level"
          :class="unreadLevelClass"
        />
      </div>
    </rc-dropdown-trigger>
    <template #dropdownCollection>
      <div class="notification-dropdown">
        <NotificationHeader class="header" />
        <div
          v-if="allNotifications.length === 0"
          class="no-notifications"
        >
          <div class="hands">
            &#x1F64C;
          </div>
          <div>
            {{ t('notificationCenter.caughtUp', {}, true) }}
          </div>
        </div>
        <div
          ref="scroller"
          class="scroll-container"
        >
          <template
            v-for="(a, index) in allNotifications"
            :key="a.title"
          >
            <rc-dropdown-separator v-if="index > 0" />
            <Notification
              :item="a"
              @didFocus="scrollPanel"
            />
          </template>
        </div>
      </div>
    </template>
  </rc-dropdown>
</template>

<style lang="scss" scoped>
  .notification-dropdown {
    display: flex;
    overflow: hidden;
    flex-direction: column;

    .header {
      flex: 0;
    }

    .scroll-container {
      overflow: auto;
      max-height: 80vh;
      padding: 5px 0;
    }
  }

  .no-notifications {
    text-align: center;
    min-width: 340px;
    margin: 40px 16px;

    .hands {
      font-size: 53px;
      padding-top: 0;
    }

    > div {
      padding-top: 16px;
    }
  }

  .level-indicator {
    display: flex;
    position: relative;
    height: 20px;
    width: 20px;

    .trigger-level {
      position: absolute;
      right: -5px;
      top: -5px;
      border-radius: 50%;
      height: 11px;
      width: 11px;
      background-color: var(--primary);
      border: 1px solid var(--header-bg); // Needed so we can see this when hovered
      transition: opacity 0.5s ease-in-out;
      opacity: 0;

      &.unread {
        opacity: 1;
        background-color: var(--error);
      }
    }
  }
</style>
