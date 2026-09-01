<script>
import ResourceDetail from '@shell/components/ResourceDetail';

export default {
  name:       'FleetApplicationViewEditPage',
  components: { ResourceDetail },
};
</script>

<template>
  <ResourceDetail
    parent-route-override="c-cluster-fleet-application"
  />
</template>
