<script>
import ResourceDetail from '@/components/ResourceDetail';

export default {
  name:       'APIKeyCreate',
  components: { ResourceDetail },
};
</script>

<template>
  <ResourceDetail resource-override="management.cattle.io.token" />
</template>
