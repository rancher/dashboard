<script>
import ResourceDetail from '@/components/ResourceDetail';

export default {
  name:       'APIKeyCreate',
  layout:     'nonav',
  components: { ResourceDetail },
};
</script>

<template>
  <ResourceDetail
    store-override="rancher"
    resource-override="token"
    parent-route-override="account"
  />
</template>
