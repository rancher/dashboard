<script setup lang="ts">
import day from 'dayjs';
import { DATE_FORMAT, TIME_FORMAT } from '@shell/store/prefs';
import { escapeHtml } from '@shell/utils/string';
import { computed, PropType } from 'vue';
import { useStore } from 'vuex';
import { StoredNotification, NotificationAction, NotificationLevel } from '@shell/store/notifications';

const CLASSES = {
  [NotificationLevel.Announcement]: 'icon-notify-announcement text-info',
  [NotificationLevel.Error]:        'icon-notify-error text-error',
  [NotificationLevel.Info]:         'icon-notify-info text-info',
  [NotificationLevel.Task]:         'icon-notify-busy text-info',
  [NotificationLevel.Warning]:      'icon-notify-warning text-warning',
  [NotificationLevel.Success]:      'icon-notify-tick text-success',
};

const emits = defineEmits(['markRead']);

const props = defineProps({ item: { type: Object as PropType<StoredNotification>, required: true } });

const store = useStore();
const dateFormat = escapeHtml( store.getters['prefs/get'](DATE_FORMAT));
const timeFormat = escapeHtml( store.getters['prefs/get'](TIME_FORMAT));

const age = computed(() => {
  const created = day(props.item?.created);
  const diff = created.diff(day(), 'day');
  let date = created.format(dateFormat);

  if (diff === 0 ) {
    date = 'Today';
  } else if (diff === 1) {
    date = 'Yesterday';
  }

  return `${ date }, ${ created.format(timeFormat) }`;
});

const clz = computed(() => CLASSES[props.item.level]);

const action = (action: NotificationAction) => {
  window.open(action.target, '_blank');
};
</script>

<template>
  <div class="notification">
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
      <div
        class="read-indicator"
        @click.stop="emits('markRead', item)"
      >
        <div
          class="read-icon"
          :class="{ 'unread': !item.read }"
        />
      </div>
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
        class="actions"
      >
        <button
          v-if="item.primaryAction"
          class="btn btn-sm role-primary"
          @click="action(item.primaryAction)"
        >
          {{ item.primaryAction.label }}
        </button>
        <button
          v-if="item.secondaryAction"
          class="btn btn-sm role-secondary"
          @click="action(item.secondaryAction)"
        >
          {{ item.secondaryAction.label }}
        </button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
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

      .read-indicator {
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

      .actions {
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
</style>
