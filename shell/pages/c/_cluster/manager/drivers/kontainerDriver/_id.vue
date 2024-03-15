<script>
import ResourceDetail from '@shell/components/ResourceDetail';

export default {
  name:       'KontainerDriverEditPage',
  components: { ResourceDetail },
};
</script>

<template>
  <ResourceDetail
    resource-override="kontainerDriver"
    parent-route-override="c-cluster-manager-driver-kontainerdriver"
  />
</template>
