<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from 'vuex';
import Notification from './Notification.vue';
import {
  RcDropdown,
  RcDropdownItem,
  RcDropdownSeparator,
  RcDropdownTrigger
} from '@components/RcDropdown';

const store = useStore();
const pageActions = computed(() => store.getters['notifications/all']);
const unreadLevelClass = computed(() => {
  return `level-${ store.getters['notifications/unreadLevel'] }`;
});
const unreadCount = computed(() => store.getters['notifications/unreadCount']);

const markRead = (item: any) => {
  store.dispatch('notifications/markRead', item.id);
};

const markAllRead = () => {
  store.dispatch('notifications/markAllRead');
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
    :aria-label="t('nav.actionMenu.label')"
    @update:open="open"
  >
    <rc-dropdown-trigger
      tertiary
      data-testid="page-actions-menu"
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
      <div
        class="notification-header"
      >
        <div class="notification-title">
          Notifications
        </div>
        <div v-if="unreadCount !== 0">
          <a
            role="button"
            href="#"
            @click.stop="markAllRead()"
          >
            Mark all as read
          </a>
        </div>
      </div>
      <div
        v-if="pageActions.length === 0"
        class="no-notifications"
      >
        <div class="hands">
          &#x1F64C;
        </div>
        <div>You're all caught up</div>
      </div>
      <div class="scroll-container">
        <template
          v-for="(a) in pageActions"
          :key="a.title"
        >
          <rc-dropdown-separator />
          <rc-dropdown-item>
            <Notification
              :item="a"
              @markRead="markRead"
            />
          </rc-dropdown-item>
        </template>
      </div>
    </template>
  </rc-dropdown>
</template>

<style lang="scss" scoped>
  .no-notifications {
    border-top: 1px solid var(--border);
    padding: 0 20px;
    text-align: center;
    min-width: 240px;
    margin: 5px 0 10px 0;

    .hands {
      font-size: 40px;
    }

    > div {
      padding-top: 10px;
    }
  }

  .scroll-container {
    max-height: 80vh;
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
      border: 1px solid #fff; // Needed so we can see this when hovered
      transition: opacity 0.5s ease-in-out;
      // transition: background-color 0.5s ease-in-out;
      opacity: 0;

      &.level-5 {
        opacity: 1;
        background-color: var(--error);
      }

      &.level-4 {
        opacity: 1;
        background-color: var(--warning);
      }

      &.level-3 {
        opacity: 1;
        background-color: var(--success);
      }

      &.level-2, &.level-0, &.level-1 {
        opacity: 1;
        background-color: var(--info);
      }

      &.level--1 {
        opacity: 0;
      }
    }
  }

  .notification-header {
    display: flex;
    align-items: center;
    padding: 8px 20px;

    .notification-title {
      font-weight: bold;
      flex: 1;
    }

    A {
      color: var(--link);
    }
  }
</style>
