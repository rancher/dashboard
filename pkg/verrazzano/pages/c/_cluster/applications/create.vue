<script>
// Added by Verrazzano
import ResourceDetail from '@shell/components/ResourceDetail';

export default {
  name:       'ApplicationCreate',
  components: { ResourceDetail },
  data() {
    return { resource: 'core.oam.dev.applicationconfiguration' };
  }
};
</script>

<template>
  <ResourceDetail :resource-override="resource" />
</template>
