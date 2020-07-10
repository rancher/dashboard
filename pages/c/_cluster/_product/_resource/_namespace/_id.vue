<script>
import ResourceDetail, { asyncData, watchQuery } from '@/components/ResourceDetail';

export default {
  name:       'ClusterResourceNamespaceId',
  components: { ResourceDetail },
  asyncData,
  watchQuery,
};
</script>

<template>
  <ResourceDetail v-bind="_data" />
</template>
