<script>
import { NotificationLevel } from '@shell/types/notifications';
import DynamicContentIcon from './DynamicContentIcon'

export default {
  name: 'DynamicContentBanner',

  components: { DynamicContentIcon },

  props: {
    location: {
      type:    String,
      default: 'banner'
    }
  },

  computed: {
    // Return the un-read hidden notifications for display on the home page
    dynamicContent() {
      let hiddenNotifications = this.$store.getters['notifications/all'].filter((n) => n.level === NotificationLevel.Hidden && !n.read);

      hiddenNotifications = hiddenNotifications.filter((n) => n.data?.location === this.location);

      return hiddenNotifications.length > 0 ? hiddenNotifications[0] : undefined;
    }
  },

  methods: {
    // Invoke action on either the primary or secondary buttons
    // This can open a URL in a new tab OR navigate to an application route
    action(action) {
      if (action.target) {
        window.open(action.target, '_blank');
      } else if (action.route) {
        try {
          this.$router.push(action.route);
        } catch (e) {
          console.error('Error navigating to route for the notification action', e); // eslint-disable-line no-console
        }
      } else {
        console.error('Notification action must either specify a "target" or a "route"'); // eslint-disable-line no-console
      }
    },
    markRead(notification) {
      this.$store.dispatch('notifications/markRead', notification.id);
    }
  }
};
</script>
<template>
  <div
    v-if="dynamicContent"
    class="home-page-dynamic-content"
  >
    <template v-if="dynamicContent.data">
      <DynamicContentIcon
        v-if="dynamicContent.data.icon"
        :class="{'mr-10': dynamicContent.data.icon }"
      />
    </template>
    <div class="dc-content">
      <div class="dc-title">
        {{ dynamicContent.title }}
      </div>
      <div class="dc-message">
        {{ dynamicContent.message }}
      </div>
    </div>
    <div class="dc-actions">
      <button
        v-if="dynamicContent.primaryAction"
        role="button"
        class="btn btn-sm role-primary"
        @click.stop.prevent="action(dynamicContent.primaryAction)"
      >
        {{ dynamicContent.primaryAction.label }}
      </button>
      <i
        class="icon icon-close"
        @click="markRead(dynamicContent)"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.home-page-dynamic-content {
  background-color: #e8e8e8;
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 8px;

  .dc-content {
    display: flex;
    flex-direction: column;
    flex: 1;
  }

  .dc-title {
    font-weight: bold;
    font-size: 1.1em;
    margin-bottom: 4px;
  }

  .dc-message {
    font-size: 1em;
  }

  .dc-actions {
    display: flex;
    align-items: center;
    margin: 0 8px;

    i {
      margin-left: 16px;
      opacity: 0.5;
      cursor: pointer;
      border: 1px solid transparent;
      padding: 4px;
      border-radius: 4px;

      &:hover {
        opacity: 1;
        color: var(--primary);
        border-color: var(--primary);
      }
    }
  }
}
</style>
