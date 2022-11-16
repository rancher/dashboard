<script>
// This component is used to show warnings when current usage exceeds support purchased through AWS Marketplace
import { MANAGEMENT } from '@shell/config/types';

export default {
  async fetch() {
    if ( this.$store.getters['management/schemaFor'](MANAGEMENT.USER_NOTIFICATION)) {
      this.notifications = await this.$store.dispatch('management/findAll', { type: MANAGEMENT.USER_NOTIFICATION });
    }
  },

  data() {
    return { notifications: [] };
  },

  computed: {
    // The notification will always come from the csp-adapter component & there will be no more than one
    // Backend will remove the notification when its no longer relevant
    awsNotification() {
      return this.notifications.find(notification => notification.componentName === 'csp-adapter');
    }
  }
};
</script>

<template>
  <div
    v-if="awsNotification"
    class="aws-compliance"
  >
    {{ awsNotification.message }}
  </div>
</template>

<style lang='scss' scoped>
.aws-compliance {
    background-color: var(--error);
    color: var(--error-text);
    line-height: 2em;
    width: 100%;
        text-align: center;

    >p{
        text-align: center;
    }
}
</style>
