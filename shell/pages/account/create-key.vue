<script>
import ResourceDetail from '@shell/components/ResourceDetail';

export default {
  name:       'APIKeyCreate',
  layout:     'plain',
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
