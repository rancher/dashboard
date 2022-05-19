<script>
/**
 * The Route and Receiver resources are deprecated. Going forward,
 * routes and receivers should be configured within AlertmanagerConfigs.
 * Any updates to receiver configuration forms, such as Slack/email/PagerDuty
 * etc, should be made to the receiver forms that are based on the
 * AlertmanagerConfig resource, which has a different API. The new forms are
 * located in @shell/edit/monitoring.coreos.com.alertmanagerconfig/types.
 */
import ResourceDetail from '@shell/components/ResourceDetail';

export default {
  name: 'RouteReceiverCreate',

  components: { ResourceDetail },

  data() {
    const { query:{ resource } } = this.$route;

    return { resource };
  }
};
</script>

<template>
  <ResourceDetail :resource-override="resource" />
</template>
