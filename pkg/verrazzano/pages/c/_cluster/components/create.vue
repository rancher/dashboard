<script>
// Added by Verrazzano
import ResourceDetail from '@shell/components/ResourceDetail';

export default {
  name:       'ComponentCreate',
  components: { ResourceDetail },
  data() {
    return { resource: 'core.oam.dev.component' };
  }
};
</script>

<template>
  <ResourceDetail :resource-override="resource" />
</template>
