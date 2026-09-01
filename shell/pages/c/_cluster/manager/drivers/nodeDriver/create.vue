<script>
import ResourceDetail from '@shell/components/ResourceDetail';

export default {
  name:       'NodeDriverCreate',
  components: { ResourceDetail },
};
</script>

<template>
  <ResourceDetail
    resource-override="nodeDriver"
    parent-route-override="c-cluster-manager-driver-nodedriver"
  />
</template>
