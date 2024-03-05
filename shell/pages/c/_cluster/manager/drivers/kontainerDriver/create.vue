<script>
import { MANAGEMENT } from '@shell/config/types';
import ResourceDetail from '@shell/components/ResourceDetail';

export default {
  name:       'KontainerDriverCreate',
  components: { ResourceDetail },
  data() {
    return { resource: MANAGEMENT.KONTAINER_DRIVER };
  }
};
</script>

<template>
  <ResourceDetail
    resource-override="management.cattle.io.kontainerdriver"
    parent-route-override="c-cluster-manager-driver-kontainerdriver"
  />
</template>
