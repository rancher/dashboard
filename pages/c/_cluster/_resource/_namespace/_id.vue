<script>
import ResourceDetail, { asyncData } from '@/components/ResourceDetail';

export default {
  name:       'ClusterResourceNamespaceId',
  components: { ResourceDetail },
  asyncData
};
</script>

<template>
  <ResourceDetail :async-data="_data" />
</template>
