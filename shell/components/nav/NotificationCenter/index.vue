<script setup lang="ts">
import {
  computed,
  ref,
} from 'vue';
import { useStore } from 'vuex';
import Notification from './Notification.vue';
import NotificationHeader from './NotificationHeader.vue';
import {
  RcDropdown,
  RcDropdownSeparator,
  RcDropdownTrigger
} from '@components/RcDropdown';

const store = useStore();
// We don't want any hidden notifications showing in the notification center (these are shown elsewhere, e.g. home page dynamic content announcements)
const allNotifications = computed(() => store.getters['notifications/visible']);
const unreadLevelClass = computed(() => {
  return store.getters['notifications/unreadCount'] === 0 ? '' : 'unread';
});

// There may be more notifications than we can show on screen, so the popover needs to scroll
const scroller = ref<HTMLElement>();

// Close all of the open growls when the notification center is shown, so that they do not overlap
const open = (opened: boolean) => {
  if (opened) {
    store.dispatch('growl/clear');
  }
};
</script>

<template>
  <rc-dropdown
    :aria-label="t('nav.notifications.label')"
    @update:open="open"
  >
    <rc-dropdown-trigger
      variant="tertiary"
      data-testid="notifications-center"
      :aria-label="t('nav.notifications.button.label')"
    >
      <div class="level-indicator">
        <i class="icon icon-lg icon-notify-bell" />
        <div
          :data-testid="`notifications-center-status${ unreadLevelClass }`"
          class="trigger-level"
          :class="unreadLevelClass"
        />
      </div>
    </rc-dropdown-trigger>
    <template #dropdownCollection>
      <div
        data-testid="notifications-center-panel"
        class="notification-dropdown"
      >
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
            :key="a.id"
          >
            <rc-dropdown-separator
              v-if="index > 0"
              class="notification-separator"
            />
            <Notification :item="a" />
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
      padding: 3px 0; // Need padding at top and bottom in order to show the focus border for the notification
    }
  }

  .notification-separator {
    margin: 0 3px;
    width: auto;
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
    width: 18px;

    .trigger-level {
      position: absolute;
      right: -6px;
      top: -4px;
      border-radius: 50%;
      height: 8px;
      width: 8px;
      background-color: var(--primary);
      transition: opacity 0.5s ease-in-out;
      opacity: 0;

      &.unread {
        opacity: 1;
        background-color: var(--error);
      }
    }
  }
</style>
