<script>
export default {
  name: 'DynamicContentIcon',

  props: {
    location: {
      type:    String,
      default: 'banner'
    }
  },

  computed: {
    src() {
      return require('~shell/assets/images/content/suse.svg');
    },

    // Return the un-read hidden notifications for display on the home page
    dynamicContent() {
      let hiddenNotifications = this.$store.getters['notifications/all'].filter((n) => n.level === NotificationLevel.Hidden && !n.read);

      hiddenNotifications = hiddenNotifications.filter((n) => n.data?.location === this.location);

      return hiddenNotifications.length > 0 ? hiddenNotifications[0] : undefined;
    }
  },
};
</script>
<template>
  <div>
    <img
      :src="src"
      class="dc-icon"
    />
  </div>
</template>

<style lang="scss" scoped>
  .dc-icon {
    width: 48px;
    height: 48px;
  }
</style>
