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
import { deriveKey, encrypt, decrypt } from '@shell/utils/crypto/encryption';

/**
 * Expire notifications in seconds (14 days)
 */
const EXPIRY = 14 * 24 * 60 * 60;

// Caches on load
let encryptionKey: CryptoKey;

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

const localStorageEventHandler = async(ev: any) => {
  if (ev.key === localStorageKey) {
    try {
      const data = await loadFromString(ev.newValue || '{}');

      store.dispatch('notifications/load', data);
    } catch (e) {
      console.error('Error parsing notifications from storage event', e); // eslint-disable-line no-console
    }
  }
};

/**
 * When notifications are updated, write to local storage
 */
watch(allNotifications, async(newData) => {
  try {
    const localStorageKey = store.getters['notifications/localStorageKey'];
    const data = JSON.stringify(newData);
    const enc = await encrypt(data, encryptionKey);

    window.localStorage.setItem(localStorageKey, JSON.stringify(enc));
  } catch (e) {
    console.error('Unable to save notifications to local storage', e); // eslint-disable-line no-console
  }
}, { deep: true });

/**
 * Load data from a string
 *
 * @param dataString String containing JSON-serialized encrypted data
 */
async function loadFromString(dataString: string) {
  let notifications: StoredNotification[] = [];

  try {
    const data = JSON.parse(dataString || '{}');

    // Legacy, not encrypted - perform basic check of data in the array
    if (Array.isArray(data)) {
      notifications = data.filter((n) => n.id && n.title);
    }

    if (data.cipher && data.iv) {
      const decrypted = await decrypt(data, encryptionKey);
      const persisted = JSON.parse(decrypted);

      if (Array.isArray(persisted)) {
        notifications = persisted as StoredNotification[];
      } else {
        console.error('Notification data is not in the expected format', persisted); // eslint-disable-line no-console
      }
    }
  } catch (e) {
    console.error('Unable to load notifications from data', e); // eslint-disable-line no-console
  }

  // Notifications needs to be an array, so check in case the data has been corrupted somehow and reset to empty state if so
  // This is an extra check
  if (!Array.isArray(notifications)) {
    console.error('Notification data looks to be corrupt - ignoring persisted data'); // eslint-disable-line no-console

    notifications = [] as StoredNotification[];
  }

  return notifications;
}

/**
 * Load the notifications from local storage on start up
 */
onMounted(async() => {
  const uuid = store.getters['notifications/userId'];
  let notifications: StoredNotification[] = [];

  try {
    encryptionKey = await deriveKey(uuid);
  } catch (e) {
    console.error('Unable to generate encryption key for notifications', e); // eslint-disable-line no-console

    return;
  }

  try {
    const data = window.localStorage.getItem(localStorageKey) || '{}';

    notifications = await loadFromString(data);
  } catch (e) {
    console.error('Unable to read notifications from local storage', e); // eslint-disable-line no-console
  }

  // Expire old notifications
  const now = new Date();

  notifications = notifications.filter((n: StoredNotification) => {
    // Try ... catch in case the date parsing fails
    try {
      const created = new Date(n.created);
      const diff = (now.getTime() - created.getTime()) / 1000; // Diff in seconds

      return diff < EXPIRY;
    } catch (e) {}

    return true;
  });

  await store.dispatch('notifications/load', notifications);

  // Listen to storage events, so if the UI is open in multiple tabs, notifications in one tab will be sync'ed across all tabs
  window.addEventListener('storage', localStorageEventHandler);
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
