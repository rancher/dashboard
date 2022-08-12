<script>
import ResourceDetail from '@shell/components/ResourceDetail';

export default {
  name:       'ClusterResourceCreate',
  components: { ResourceDetail },
  data() {
    return {
      /**
       * Inherited global identifier prefix for tests
       * Define a term based on the parent component to avoid conflicts on multiple components
       */
      componentTestid: 'cluster-manager-create'
    };
  }
};
</script>

<template>
  <ResourceDetail :component-testid="componentTestid" />
</template>
