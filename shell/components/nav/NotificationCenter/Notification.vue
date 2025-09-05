<script setup lang="ts">
import day from 'dayjs';
import { DATE_FORMAT, TIME_FORMAT } from '@shell/store/prefs';
import { escapeHtml } from '@shell/utils/string';
import { computed, inject, ref } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { useI18n } from '@shell/composables/useI18n';
import { NotificationAction, NotificationLevel, StoredNotification } from '@shell/types/notifications';
import { DropdownContext, defaultContext } from '@components/RcDropdown/types';
import { useDropdownItem } from '@components/RcDropdown/useDropdownItem';

const CLASSES = {
  [NotificationLevel.Announcement]: 'icon-notify-announcement text-info',
  [NotificationLevel.Error]:        'icon-notify-error text-error',
  [NotificationLevel.Info]:         'icon-notify-info text-info',
  [NotificationLevel.Task]:         'icon-notify-busy text-info',
  [NotificationLevel.Warning]:      'icon-notify-warning text-warning',
  [NotificationLevel.Success]:      'icon-notify-tick text-success',
};

const emits = defineEmits(['didFocus']);

const props = defineProps<{item: StoredNotification}>();
const { dropdownItems } = inject<DropdownContext>('dropdownContext') || defaultContext;

const store = useStore();
const { t } = useI18n(store);
const router = useRouter();
const unreadCount = computed<number>(() => store.getters['notifications/unreadCount']);
const dateFormat = escapeHtml( store.getters['prefs/get'](DATE_FORMAT));
const timeFormat = escapeHtml( store.getters['prefs/get'](TIME_FORMAT));

const { close, scrollIntoView } = useDropdownItem();

// Outer element for the notification
const dropdownMenuItem = ref<HTMLElement>();

// Refs to the 3 buttons that can be in the notification
const readButton = ref<HTMLElement>();
const primaryActionButton = ref<HTMLElement>();
const secondaryActionButton = ref<HTMLElement>();

// These are the buttons in the notification that can be tabbed between when in the focus trap
const tabItems = computed(() => {
  const items: HTMLElement[] = [];

  if (readButton.value) {
    items.push(readButton.value);
  }

  if (props.item.primaryAction && primaryActionButton.value) {
    items.push(primaryActionButton.value);
  }

  if (props.item.secondaryAction && secondaryActionButton.value) {
    items.push(secondaryActionButton.value);
  }

  return items;
});

// Ensure the aria label changes when read/unread is toggled
const toggleLabel = computed(() => {
  return props.item.read ? t('notificationCenter.markRead') : t('notificationCenter.markUnread');
});

const age = computed(() => {
  const created = day(props.item?.created);
  const diff = created.diff(day(), 'day');
  let date = created.format(dateFormat);

  if (diff === 0 ) {
    date = t('notificationCenter.dates.today');
  } else if (diff === 1) {
    date = t('notificationCenter.dates.yesterday');
  }

  return `${ date }, ${ created.format(timeFormat) }`;
});

const clz = computed(() => CLASSES[props.item.level]);

// Invoke action on either the primary or secondary buttons
// This can open a URL in a new tab OR navigate to an application route
const action = (action: NotificationAction) => {
  if (action.target) {
    window.open(action.target, '_blank');
  } else if (action.route) {
    try {
      router.push(action.route);
    } catch (e) {
      console.error('Error navigating to route for the notification action', e); // eslint-disable-line no-console
    }
    close();
  } else {
    console.error('Notification action must either specify a "target" or a "route"'); // eslint-disable-line no-console
  }
};

const toggleRead = (e: MouseEvent | KeyboardEvent, fromKeyboard = false) => {
  if (props.item.read) {
    store.dispatch('notifications/markUnread', props.item.id);
  } else {
    store.dispatch('notifications/markRead', props.item.id);
  }

  if (fromKeyboard) {
    e.preventDefault();
    e.stopPropagation();
  }
};

// User presses enter or space on the notification, so enter the focus trap
const enterFocusTrap = (e: MouseEvent | KeyboardEvent) => {
  const elementToFocus = tabItems.value[0];

  elementToFocus.focus();

  e.preventDefault();
  e.stopPropagation();
};

// Inner focus next
// Move the tab between the buttons within the notification when it is in a focus trap
const innerFocusNext = (e: KeyboardEvent) => {
  const index = tabItems.value.indexOf(e.target as HTMLElement);

  // Sanity check - shouldn't happen
  if (index < 0) {
    return;
  }

  let nextIndex = e.shiftKey ? index - 1 : index + 1;

  if (nextIndex < 0) {
    nextIndex = tabItems.value.length - 1;
  } else if (nextIndex === tabItems.value.length) {
    nextIndex = 0;
  }

  const nextElement = tabItems.value[nextIndex] as HTMLElement;

  nextElement.focus();

  e.stopPropagation();
  e.preventDefault();
};

// Exit inner focus - this is the state when the notification has a focus trap and you are tabbing between
// the controls in the notification - this function is typically called when the user presses ESCape
// and we want to exit this focus trap
const exitFocusTrap = (e: MouseEvent | KeyboardEvent) => {
  // Return focus to the outer notification div
  dropdownMenuItem.value?.focus();

  e.stopPropagation();
  e.preventDefault();
};

const gotFocus = () => {
  const activeItem = document.activeElement;
  const activeIndex = dropdownItems.value.indexOf(activeItem || new HTMLElement());

  // Let the scroll container decide if it needs to adjust the scroll to show the item fully
  emits('didFocus', activeIndex, dropdownItems.value.length);
};

const handleKeydown = (e: KeyboardEvent) => {
  const activeItem = document.activeElement;
  const activeIndex = dropdownItems.value.indexOf(activeItem || new HTMLElement());

  if (activeIndex < 0) {
    return;
  }

  const shouldAdvance = e.key === 'ArrowDown';
  const newIndex = findNewIndex(shouldAdvance, activeIndex, dropdownItems.value);

  if (dropdownItems.value[newIndex] instanceof HTMLElement) {
    dropdownItems.value[newIndex].focus();
  }
};

/**
 * This allows the user to press up/down while in the focus trap for a notification and exit the focus trap and move to the next/previous notification
 */
const handleKeydownFocusTrap = (e: KeyboardEvent) => {
  exitFocusTrap(e);
  handleKeydown(e);
};

/**
 * Finds the new index for the dropdown item based on the key pressed.
 * @param shouldAdvance - Whether to advance to the next or previous item.
 * @param activeIndex - Current active index.
 * @param itemsArr - Array of dropdown items.
 * @returns The new index.
 */
const findNewIndex = (shouldAdvance: boolean, activeIndex: number, itemsArr: Element[]) => {
  const newIndex = shouldAdvance ? activeIndex + 1 : activeIndex - 1;

  if (!shouldAdvance && activeIndex === 1 && unreadCount.value === 0) {
    // Special case
    // We are the top notification, there are no unread and the uses has pressed up
    // We want to skip the notification header, as this won't have the 'Mark all as read' button
    return itemsArr.length - 1;
  }

  if (newIndex > itemsArr.length - 1) {
    return 0;
  }

  if (newIndex < 0) {
    return itemsArr.length - 1;
  }

  return newIndex;
};
</script>

<template>
  <div
    ref="dropdownMenuItem"
    dropdown-menu-item
    tabindex="-1"
    role="menuitem"
    data-testid="notifications-center-item"
    :aria-label="t('notificationCenter.ariaLabel', { title: item.title })"
    :class="{ 'notification-unread': !item.read }"
    @keydown.up.down.stop.prevent="handleKeydown"
    @focusin="scrollIntoView"
    @focus.stop="gotFocus"
    @click.stop
    @keydown.enter.space.stop="enterFocusTrap"
  >
    <div
      class="notification"
      :data-testid="`notifications-center-item-${ item.id }`"
    >
      <div class="sep" />
      <div class="top">
        <div class="icon">
          <i
            class="icon"
            :class="clz"
          />
        </div>
        <div class="item-title">
          {{ item.title }}
        </div>
        <button
          ref="readButton"
          v-clean-tooltip="item.read ? t('notificationCenter.markUnread') : t('notificationCenter.markRead')"
          class="read-indicator"
          role="button"
          :aria-label="toggleLabel"
          @keydown.enter.space.stop="toggleRead($event, true)"
          @keydown.tab.stop="innerFocusNext($event)"
          @keydown.escape.stop="exitFocusTrap"
          @keydown.up.down.prevent.stop="handleKeydownFocusTrap"
          @click.stop="toggleRead($event, false)"
        >
          <div>
            <div
              class="read-icon"
              :class="{ 'unread': !item.read }"
            />
          </div>
        </button>
      </div>
      <div class="bottom">
        <div class="created text-muted">
          {{ age }}
        </div>
        <div
          v-if="item.message"
          class="message"
        >
          {{ item.message }}
        </div>
        <div
          v-if="item.level === NotificationLevel.Task && typeof item.progress === 'number'"
          class="progress"
        >
          <div class="progress-bar">
            <div class="pb-background" />
            <div
              :style="{width: `${item.progress}%`}"
              class="pb-foreground"
            />
          </div>
          <div class="progress-percent text-muted">
            {{ item.progress }}%
          </div>
        </div>
        <div
          v-if="item.primaryAction || item.secondaryAction"
          class="notification-actions"
        >
          <button
            v-if="item.primaryAction"
            ref="primaryActionButton"
            role="button"
            class="btn btn-sm role-primary"
            @keydown.enter.space.stop="action(item.primaryAction)"
            @keydown.tab.stop="innerFocusNext($event)"
            @keydown.escape.stop="exitFocusTrap"
            @click.stop.prevent="action(item.primaryAction)"
            @keydown.up.down.prevent.stop="handleKeydownFocusTrap"
          >
            {{ item.primaryAction.label }}
          </button>
          <button
            v-if="item.secondaryAction"
            ref="secondaryActionButton"
            role="button"
            class="btn btn-sm role-secondary"
            @keydown.enter.space.stop="action(item.secondaryAction)"
            @keydown.tab.stop="innerFocusNext($event)"
            @keydown.escape.stop="exitFocusTrap"
            @click.stop.prevent="action(item.secondaryAction)"
            @keydown.up.down.prevent.stop="handleKeydownFocusTrap"
          >
            {{ item.secondaryAction.label }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  [dropdown-menu-item] {
    display: flex;
    gap: 8px;
    align-items: center;
    padding: 12px;
    margin: 0 3px;

    &.notification-unread {
      background-color: var(--notification-unread-bg);
    }

    &:focus-visible, &:focus {
      @include focus-outline;
      outline-offset: 0;
    }

    .notification {
      width: 400px;
      display: flex;
      flex-direction: column;

      .top {
        align-items: center;
        display: flex;
        padding: 0;

        .icon {
          display: flex;
          text-align: center;
          vertical-align: middle;
          width: 32px;
        }

        .item-title {
          flex: 1;
          font-weight: 700;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        button.read-indicator {
          line-height: normal;
          min-height: auto;
          padding: 8px;
          margin-left: 16px;
          background-color: unset;
          display: flex;
          align-items: center;
          justify-content: center;

          &:disabled {
            cursor: default;
          }

          &:focus-visible {
            @include focus-outline;
            outline-offset: 2px;
          }

          .read-icon {
            border: 2px solid var(--primary);
            border-radius: 50%;
            width: 8px;
            height: 8px;

            &.unread {
              background-color: var(--primary);
            }
          }

          // Add subtle effect when hovering over the unread button
          &:hover .read-icon.unread {
            opacity: 0.5;
          }
        }
      }

      .bottom {
        margin-left: 32px; // 20px icon + 12px spacing

        .created {
          font-size: 13px;
        }

        .message {
          line-height: 20px;
          padding: 6px 0;
        }

        .progress {
          display: flex;
          margin-top: 6px;

          .progress-bar {
            align-items: center;
            display: flex;
            position: relative;
            flex: 1;

            .pb-foreground, .pb-background {
              position: absolute;
              height: 6px;
              border-radius: 5px;
              background-color: var(--primary);
              transition: width 0.1s ease-in;
            }

            .pb-background {
              opacity: 0.5;
              width: 100%;
            }
          }

          .progress-percent {
            font-size: 13px;
            margin-left: 16px;
            min-width: 40px;
            text-align: right;
          }
        }

        .notification-actions {
          display: flex;
          margin-top: 12px;

          > button:not(:first-child) {
            margin-left: 12px;
          }
        }
      }

      .icon {
        font-size: 20px;
        width: 32px;
      }

      .content {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-content: flex-start;

        .item-title {
          font-weight: bold;
          margin-bottom: 4px;
        }
      }
    }
  }
</style>
