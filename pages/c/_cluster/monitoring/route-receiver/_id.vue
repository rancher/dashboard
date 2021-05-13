<script>
import ResourceDetail from '@/components/ResourceDetail';

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
