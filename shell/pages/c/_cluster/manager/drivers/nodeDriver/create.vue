<script>
import { MANAGEMENT } from '@shell/config/types';
import ResourceDetail from '@shell/components/ResourceDetail';

export default {
  name:       'NodeDriverCreate',
  components: { ResourceDetail },
  data() {
    return { resource: MANAGEMENT.NODE_DRIVER };
  }
};
</script>

<template>
  <ResourceDetail
    resource-override="management.cattle.io.nodedriver"
    parent-route-override="c-cluster-manager-driver-nodedriver"
  />
</template>
