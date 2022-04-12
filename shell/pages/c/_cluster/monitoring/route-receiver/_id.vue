<script>
import ResourceDetail from '@shell/components/ResourceDetail';

export default {
  name: 'RouteReceiverDetail',

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
