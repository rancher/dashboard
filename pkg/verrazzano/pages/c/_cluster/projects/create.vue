<script>
// Added by Verrazzano
import ResourceDetail from '@shell/components/ResourceDetail';

export default {
  name:       'ProjectCreate',
  components: { ResourceDetail },
  data() {
    return { resource: 'clusters.verrazzano.io.verrazzanoproject' };
  }
};
</script>

<template>
  <ResourceDetail :resource-override="resource" />
</template>
