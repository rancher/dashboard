<script setup lang="ts">
import {
  computed,
  onMounted,
  onUnmounted,
  ref,
  watch
} from 'vue';
import { useStore } from 'vuex';
import Notification from './Notification.vue';
import NotificationHeader from './NotificationHeader.vue';
import {
  RcDropdown,
  RcDropdownSeparator,
  RcDropdownTrigger
} from '@components/RcDropdown';
import { StoredNotification } from '@shell/types/notifications';
import { encrypt } from '@shell/utils/crypto/encryption';
import { loadFromString } from '@shell/utils/notifications';
import { onExtensionsReady } from '@shell/utils/uiplugins';

const store = useStore();
const allNotifications = computed(() => store.getters['notifications/all']);
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

const localStorageKey = store.getters['notifications/localStorageKey'];
const encryptionKey = store.getters['notifications/encryptionKey'];

const localStorageEventHandler = async(ev: any) => {
  if (ev.key === localStorageKey) {
    try {
      const data = await loadFromString(ev.newValue || '{}', encryptionKey);

      store.dispatch('notifications/load', data);
    } catch (e) {
      console.error('Error parsing notifications from storage event', e); // eslint-disable-line no-console
    }
  }
};

/**
 * When notifications are updated, write to local storage
 */
watch(allNotifications, async(newData: StoredNotification[]) => {
  try {
    const data = JSON.stringify(newData);
    const enc = await encrypt(data, encryptionKey);

    window.localStorage.setItem(localStorageKey, JSON.stringify(enc));
  } catch (e) {
    console.error('Unable to save notifications to local storage', e); // eslint-disable-line no-console
  }
}, { deep: true });

onMounted(async() => {
  // Listen to storage events, so if the UI is open in multiple tabs, notifications in one tab will be sync'ed across all tabs
  window.addEventListener('storage', localStorageEventHandler);

  await onExtensionsReady(store);
});

onUnmounted(() => {
  window.removeEventListener('storage', localStorageEventHandler);
});
</script>

<template>
  <rc-dropdown
    :aria-label="t('nav.notifications.label')"
    @update:open="open"
  >
    <rc-dropdown-trigger
      tertiary
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
            <rc-dropdown-separator v-if="index > 0" />
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
      transition: opacity 0.5s ease-in-out;
      opacity: 0;

      &.unread {
        opacity: 1;
        background-color: var(--error);
      }
    }
  }
</style>
