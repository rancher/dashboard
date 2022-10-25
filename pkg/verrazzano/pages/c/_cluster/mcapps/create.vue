<script>
// Added by Verrazzano
import ResourceDetail from '@shell/components/ResourceDetail';

export default {
  name:       'MultiClusterAppCreate',
  components: { ResourceDetail },
  data() {
    return { resource: 'clusters.verrazzano.io.multiclusterapplicationconfiguration' };
  }
};
</script>

<template>
  <ResourceDetail :resource-override="resource" />
</template>
