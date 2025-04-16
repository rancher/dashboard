<script setup lang="ts">
import day from 'dayjs';
import { DATE_FORMAT, TIME_FORMAT } from '@shell/store/prefs';
import { escapeHtml } from '@shell/utils/string';
import { computed, inject, PropType, ref } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import { StoredNotification, NotificationAction, NotificationLevel } from '@shell/store/notifications';
import { DropdownContext, defaultContext } from '@components/RcDropdown/types';

const CLASSES = {
  [NotificationLevel.Announcement]: 'icon-notify-announcement text-info',
  [NotificationLevel.Error]:        'icon-notify-error text-error',
  [NotificationLevel.Info]:         'icon-notify-info text-info',
  [NotificationLevel.Task]:         'icon-notify-busy text-info',
  [NotificationLevel.Warning]:      'icon-notify-warning text-warning',
  [NotificationLevel.Success]:      'icon-notify-tick text-success',
};

const emits = defineEmits(['didFocus']);

const props = defineProps({ item: { type: Object as PropType<StoredNotification>, required: true } });
const { dropdownItems } = inject<DropdownContext>('dropdownContext') || defaultContext;

const store = useStore();
const { t } = useI18n(store);
const unreadCount = computed<number>(() => store.getters['notifications/unreadCount']);
const dateFormat = escapeHtml( store.getters['prefs/get'](DATE_FORMAT));
const timeFormat = escapeHtml( store.getters['prefs/get'](TIME_FORMAT));

// Outer element for the notification
const dropdownMenuItem = ref<HTMLElement>();

// Refs to the 3 buttons that can be in the notification
const readButton = ref<HTMLElement>();
const primaryActionButton = ref<HTMLElement>();
const secondaryActionButton = ref<HTMLElement>();

// These are the buttons in the notification that can be tabbed between when in the focus trap
const tabItems = computed(() => {
  const items: HTMLElement[] = [];

  if (!props.item.read && readButton.value) {
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

// Open a URL from either the primary or secondary buttons in a new tab
const action = (action: NotificationAction) => {
  window.open(action.target, '_blank');
};

const markRead = (e: MouseEvent | KeyboardEvent, fromKeyboard = false) => {
  store.dispatch('notifications/markRead', props.item.id);

  // Okay, if the user marks the notification as read, the button is then disabled
  // as you can't toggle it back to unread, so if there are no other actions in
  // the notification, then focus should return to the outer notification
  // Note we don't want to do this if interacted with by the mouse
  if (fromKeyboard) {
    if (tabItems.value.length === 0) {
      // There are no tab items, so return focus to the outer notification
      dropdownMenuItem.value?.focus();
    } else {
      // Move focus to the first button
      const elementToFocus = tabItems.value[0];

      elementToFocus.focus();

      e.preventDefault();
      e.stopPropagation();
    }
  }
};

// User presses enter or space on the notification, so enter the focus trap
const enterFocusTrap = (e: MouseEvent | KeyboardEvent) => {
  // If there is only one tab item and we are marked read, then we can't enter the focus trap, as there is nothing to receive focus, so keep focus on the notification
  if (tabItems.value.length === 0 && props.item.read) {
    return;
  }

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
    @keydown.up.down.stop="handleKeydown"
    @focus.stop="gotFocus"
    @click.stop
    @keydown.enter.space.stop="enterFocusTrap"
  >
    <div
      class="notification"
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
          tab-index="0"
          class="read-indicator"
          role="button"
          :disabled="!!item.read"
          @keydown.enter.space.stop="markRead($event, true)"
          @keydown.tab.stop="innerFocusNext($event)"
          @keydown.escape.stop="exitFocusTrap"
          @click.stop="markRead($event, false)"
        >
          <div
            class="read-icon"
            :class="{ 'unread': !item.read }"
          />
        </button>
      </div>
      <div class="bottom">
        <div class="created">
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
          <div class="progress-percent">
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
            tab-index="1"
            role="button"
            class="btn btn-sm role-primary"
            @keydown.enter.space.stop="action(item.primaryAction)"
            @keydown.tab.stop="innerFocusNext($event)"
            @keydown.escape.stop="exitFocusTrap"
            @click.stop="action(item.primaryAction)"
          >
            {{ item.primaryAction.label }}
          </button>
          <button
            v-if="item.secondaryAction"
            ref="secondaryActionButton"
            tab-index="2"
            role="button"
            class="btn btn-sm role-secondary"
            @keydown.enter.space.stop="action(item.secondaryAction)"
            @keydown.tab.stop="innerFocusNext($event)"
            @keydown.escape.stop="exitFocusTrap"
            @click.stop="action(item.secondaryAction)"
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
    padding: 9px 8px;
    margin: 0 9px;
    border-radius: 4px;

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
        padding: 4px 0;

        .icon {
          display: flex;
          width: 32px;
          text-align: center;
          vertical-align: middle;
          margin-right: 4px;
        }

        .item-title {
          flex: 1;
          font-weight: bold;
        }

        button.read-indicator {
          line-height: normal;
          min-height: auto;
          padding: 0;

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
            width: 10px;
            height: 10px;

            &.unread {
              background-color: var(--primary);
            }
          }
        }
      }

      .bottom {
        margin-left: 36px;

        .created {
          font-size: 12px;
          opacity: 0.6;
        }

        .message {
          margin-top: 8px;
        }

        .progress {
          display: flex;
          margin-top: 5px;

          .progress-bar {
            align-items: center;
            display: flex;
            position: relative;
            flex: 1;

            .pb-foreground, .pb-background {
              position: absolute;
              height: 8px;
              border-radius: 4px;
              background-color: var(--primary);
              transition: width 0.1s ease-in;
            }

            .pb-background {
              opacity: 0.5;
              width: 100%;
            }
          }

          .progress-percent {
            margin-left: 10px;
            min-width: 48px;
            opacity: 0.5;
            text-align: right;
          }
        }

        .notification-actions {
          display: flex;
          margin-top: 10px;

          > button:not(:first-child) {
            margin-left: 10px;
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
