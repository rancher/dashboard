<script>
import ResourceDetail from '@shell/components/ResourceDetail';

export default {
  name: 'RouteReceiverCreate',

  components: { ResourceDetail },

  data() {
    return { resource: null };
  },

  created() {
    this.resource = this.$route.query.resource;
  }
};
</script>

<template>
  <ResourceDetail :resource-override="resource" />
</template>
